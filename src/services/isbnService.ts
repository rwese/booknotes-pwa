import type { ISBNLookupResult } from '../types'
import { API_CONFIG } from '../config/api'

export class ISBNService {
  private static instance: ISBNService

  static getInstance(): ISBNService {
    if (!ISBNService.instance) {
      ISBNService.instance = new ISBNService()
    }
    return ISBNService.instance
  }

  async lookup(isbn: string): Promise<ISBNLookupResult> {
    const cleanISBN = this.cleanISBN(isbn)

    if (!this.validateISBN(cleanISBN)) {
      throw new Error('Invalid ISBN format')
    }

    // Try Google Books first, fallback to Open Library
    try {
      return await this.lookupGoogleBooks(cleanISBN)
    } catch {
      return await this.lookupOpenLibrary(cleanISBN)
    }
  }

  private cleanISBN(isbn: string): string {
    return isbn
      .trim()
      .replace(/[-\s]/g, '')
      .toUpperCase()
  }

  validateISBN(isbn: string): boolean {
    const cleanISBN = this.cleanISBN(isbn)

    // ISBN-10
    if (cleanISBN.length === 10) {
      return this.validateISBN10(cleanISBN)
    }

    // ISBN-13
    if (cleanISBN.length === 13) {
      return this.validateISBN13(cleanISBN)
    }

    return false
  }

  private validateISBN10(isbn: string): boolean {
    if (!/^[0-9]{9}[0-9X]$/.test(isbn)) return false

    let sum = 0
    for (let i = 0; i < 10; i++) {
      const char = isbn[i]
      const value = char === 'X' ? 10 : parseInt(char, 10)
      sum += value * (10 - i)
    }

    return sum % 11 === 0
  }

  private validateISBN13(isbn: string): boolean {
    if (!/^[0-9]{13}$/.test(isbn)) return false

    let sum = 0
    for (let i = 0; i < 13; i++) {
      const digit = parseInt(isbn[i], 10)
      sum += digit * (i % 2 === 0 ? 1 : 3)
    }

    return sum % 10 === 0
  }

  private async lookupGoogleBooks(isbn: string): Promise<ISBNLookupResult> {
    const url = `${API_CONFIG.proxyBaseUrl}/isbn/${isbn}?source=google`

    const response = await fetch(url, {
      headers: this.getProxyHeaders()
    })
    if (!response.ok) {
      throw new Error('Network error')
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      throw new Error('Book not found')
    }

    const book = data.items[0].volumeInfo

    // Download cover image
    let coverImageData: Blob | undefined
    let coverThumbnailData: Blob | undefined

    if (book.imageLinks?.thumbnail) {
      const imageUrl = book.imageLinks.thumbnail.replace('http://', 'https://')
      try {
        coverImageData = await this.downloadImage(imageUrl)
        coverThumbnailData = await this.generateThumbnail(coverImageData)
      } catch {
        // Ignore image download errors
      }
    }

    return {
      title: book.title || '',
      authors: book.authors || [],
      publisher: book.publisher,
      publicationYear: this.extractYear(book.publishedDate),
      genre: book.categories?.[0],
      language: book.language,
      pageCount: book.pageCount,
      description: book.description,
      isbn10: book.industryIdentifiers?.find((i: { type: string }) => i.type === 'ISBN_10')?.identifier,
      isbn13: book.industryIdentifiers?.find((i: { type: string }) => i.type === 'ISBN_13')?.identifier,
      coverImageUrl: book.imageLinks?.thumbnail,
      coverImageData,
      coverThumbnailData,
      source: 'googleBooks'
    }
  }

  private async lookupOpenLibrary(isbn: string): Promise<ISBNLookupResult> {
    const url = `${API_CONFIG.proxyBaseUrl}/isbn/${isbn}?source=openlibrary`

    const response = await fetch(url, {
      headers: this.getProxyHeaders()
    })
    if (!response.ok) {
      throw new Error('Book not found')
    }

    const book = await response.json()

    // Fetch author names
    const authors: string[] = []
    if (book.authors) {
      for (const authorRef of book.authors) {
        try {
          const authorUrl = `${API_CONFIG.proxyBaseUrl}/isbn/author?key=${encodeURIComponent(authorRef.key)}`
          const authorResponse = await fetch(authorUrl, {
            headers: this.getProxyHeaders()
          })
          if (authorResponse.ok) {
            const authorData = await authorResponse.json()
            if (authorData.name) {
              authors.push(this.standardizeAuthorName(authorData.name))
            }
          }
        } catch {
          // Ignore author fetch errors
        }
      }
    }

    // Download cover image
    let coverImageData: Blob | undefined
    let coverThumbnailData: Blob | undefined

    const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    try {
      coverImageData = await this.downloadImage(coverUrl)
      coverThumbnailData = await this.generateThumbnail(coverImageData)
    } catch {
      // Ignore image download errors
    }

    return {
      title: book.title || '',
      authors,
      publisher: book.publishers?.[0],
      publicationYear: this.extractYear(book.publishDate),
      language: book.languages?.[0]?.key?.replace('/languages/', ''),
      pageCount: book.numberOfPages,
      isbn10: book.isbn10?.[0],
      isbn13: book.isbn13?.[0],
      coverImageUrl: coverUrl,
      coverImageData,
      coverThumbnailData,
      source: 'openLibrary'
    }
  }

  private getProxyHeaders(): HeadersInit {
    return {
      'X-API-Key': API_CONFIG.apiKey
    }
  }

  private async downloadImage(url: string): Promise<Blob> {
    const proxyUrl = `${API_CONFIG.proxyBaseUrl}/cover/?url=${encodeURIComponent(url)}`
    const response = await fetch(proxyUrl, {
      headers: this.getProxyHeaders()
    })
    if (!response.ok) {
      throw new Error('Failed to download image')
    }
    return response.blob()
  }

  private async generateThumbnail(imageBlob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Target size: 200x300 (2:3 ratio)
        const targetWidth = 200
        const targetHeight = 300

        canvas.width = targetWidth
        canvas.height = targetHeight

        if (ctx) {
          // Fit image within target while maintaining aspect ratio
          const scale = Math.min(targetWidth / img.width, targetHeight / img.height)
          const x = (targetWidth - img.width * scale) / 2
          const y = (targetHeight - img.height * scale) / 2

          ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to create thumbnail'))
              }
            },
            'image/jpeg',
            0.8
          )
        } else {
          reject(new Error('Could not get canvas context'))
        }
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(imageBlob)
    })
  }

  private extractYear(dateString?: string): number | undefined {
    if (!dateString) return undefined

    // Try to extract year from various formats
    const yearMatch = dateString.match(/\b(\d{4})\b/)
    if (yearMatch) {
      return parseInt(yearMatch[1], 10)
    }

    return undefined
  }

  private standardizeAuthorName(name: string): string {
    // Handle "Last, First" format
    if (name.includes(',')) {
      const parts = name.split(',')
      if (parts.length === 2) {
        return `${parts[1].trim()} ${parts[0].trim()}`
      }
    }

    return name.trim()
  }
}

export const isbnService = ISBNService.getInstance()
