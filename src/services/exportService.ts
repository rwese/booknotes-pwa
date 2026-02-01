import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { db, blobToBase64, base64ToBlob } from '../db/schema'
import { bookRepository } from '../db/repositories/bookRepository'
import { noteRepository } from '../db/repositories/noteRepository'
import { categoryRepository } from '../db/repositories/categoryRepository'
import { sessionRepository } from '../db/repositories/sessionRepository'
import { coverImageService } from '../services/coverImageService'
import type { Book, Note, BookCategory, ReadingSession, ExportMetadata, ExportBook } from '../types'

const APP_VERSION = '1.0'

export type ImportStrategy = 'merge' | 'keepExisting' | 'keepBoth'

export class ExportService {
  private static instance: ExportService

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService()
    }
    return ExportService.instance
  }

  async exportToJSON(): Promise<void> {
    const books = await db.books.toArray()
    const notes = await db.notes.toArray()
    const categories = await db.categories.toArray()
    const sessions = await db.readingSessions.toArray()

    // Convert books to export format with base64 cover images
    const exportBooks: (ExportBook & { coverImageBase64?: string })[] = []

    for (const book of books) {
      let coverImageBase64: string | undefined

      if (book.coverImageData) {
        const base64 = await blobToBase64(book.coverImageData)
        coverImageBase64 = base64
      }

      exportBooks.push({
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        genre: book.genre,
        pageCount: book.pageCount,
        publicationYear: book.publicationYear,
        readingStatus: book.readingStatus,
        rating: book.rating,
        tags: book.tags,
        categoryIds: book.categoryIds,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        coverKey: book.id,
        coverFilename: coverImageBase64 ? `${book.id}_cover.jpg` : null,
        coverImageBase64
      })
    }

    const exportData = {
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      books: exportBooks,
      notes,
      categories,
      sessions
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    saveAs(blob, `booknotes-export-${new Date().toISOString().split('T')[0]}.json`)
  }

  async exportToZIP(): Promise<void> {
    const books = await db.books.toArray()
    const notes = await db.notes.toArray()
    const categories = await db.categories.toArray()
    const sessions = await db.readingSessions.toArray()

    const zip = new JSZip()

    // Convert cover images to base64 for export
    const coverMapping: Record<string, string> = {}
    let booksWithCovers = 0

    const exportBooks: ExportBook[] = await Promise.all(
      books.map(async (book): Promise<ExportBook> => {
        let coverFilename: string | null = null

        if (book.coverImageData) {
          const base64 = await blobToBase64(book.coverImageData)
          // Remove the data URL prefix
          const base64Data = base64.split(',')[1]
          coverFilename = `${book.id}_cover.jpg`
          zip.file(`covers/${coverFilename}`, base64Data, { base64: true })
          coverMapping[book.id] = coverFilename
          booksWithCovers++
        }

        return {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          isbn10: book.isbn10,
          isbn13: book.isbn13,
          publisher: book.publisher,
          publicationYear: book.publicationYear,
          genre: book.genre,
          language: book.language,
          pageCount: book.pageCount,
          subtitle: book.subtitle,
          readingStatus: book.readingStatus,
          rating: book.rating,
          tags: book.tags,
          categoryIds: book.categoryIds,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt,
          coverKey: book.id,
          coverFilename,
          customNotes: book.customNotes,
          purchaseDate: book.purchaseDate,
          purchasePrice: book.purchasePrice,
          readingStartedAt: book.readingStartedAt,
          finishedReadingAt: book.finishedReadingAt,
          totalReadingTimeSeconds: book.totalReadingTimeSeconds,
          averageReadingTimePerDay: book.averageReadingTimePerDay,
          coverCropRect: book.coverCropRect,
          coverScale: book.coverScale,
          coverOffset: book.coverOffset
        }
      })
    )

    const metadata: ExportMetadata = {
      appVersion: APP_VERSION,
      books: exportBooks,
      coverMapping,
      totalBooks: books.length,
      booksWithCovers
    }

    zip.file('metadata.json', JSON.stringify(metadata, null, 2))

    // Add notes
    const notesWithoutBookData = notes.map(({ bookId, ...rest }) => rest)
    zip.file('notes.json', JSON.stringify(notesWithoutBookData, null, 2))

    // Add categories
    zip.file('categories.json', JSON.stringify(categories, null, 2))

    // Add reading sessions
    zip.file('sessions.json', JSON.stringify(sessions, null, 2))

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `booknotes-export-${new Date().toISOString().split('T')[0]}.zip`)
  }

  async importFromJSON(file: File, strategy: ImportStrategy = 'merge'): Promise<{
    imported: number
    skipped: number
    errors: string[]
  }> {
    const text = await file.text()
    const data = JSON.parse(text)

    // Process books to convert base64 cover images to Blobs
    if (data.books && Array.isArray(data.books)) {
      for (const book of data.books as Record<string, unknown>[]) {
        if (book.coverImageBase64 && typeof book.coverImageBase64 === 'string') {
          try {
            const coverBlob = await base64ToBlob(book.coverImageBase64)
            book.coverImageData = coverBlob
            delete book.coverImageBase64

            // Generate thumbnail for list view
            try {
              const thumbnail = await coverImageService.generateThumbnail(coverBlob)
              book.coverThumbnailData = thumbnail
            } catch {
              console.warn(`Failed to generate thumbnail for book ${book.id}`)
            }
          } catch (error) {
            console.error('Failed to convert cover image:', error)
          }
        }
      }
    }

    const result = await this.importData(data, strategy)
    return result
  }

  async importFromZIP(file: File, strategy: ImportStrategy = 'merge'): Promise<{
    imported: number
    skipped: number
    errors: string[]
  }> {
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    let data: Record<string, unknown> = {}

    // Check if it's the new format with metadata.json
    if (zip.file('metadata.json')) {
      const metadataText = await zip.file('metadata.json')!.async('string')
      const metadata = JSON.parse(metadataText)

      // Convert new format to internal format
      data = await this.convertMetadataToInternalFormat(metadata, zip)
    } else if (zip.file('books')) {
      // Check for old format
      const booksText = await zip.file('books')!.async('string')
      data.books = JSON.parse(booksText)

      if (zip.file('notes')) {
        const notesText = await zip.file('notes')!.async('string')
        data.notes = JSON.parse(notesText)
      }

      if (zip.file('categories')) {
        const categoriesText = await zip.file('categories')!.async('string')
        data.categories = JSON.parse(categoriesText)
      }

      if (zip.file('sessions')) {
        const sessionsText = await zip.file('sessions')!.async('string')
        data.sessions = JSON.parse(sessionsText)
      }
    }

    const result = await this.importData(data, strategy)
    return result
  }

  private async convertMetadataToInternalFormat(metadata: ExportMetadata, zip: JSZip): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = { books: [] }

    // Convert export books to internal format
    const books: Book[] = []

    // Check if this is native app format (uses coverKey as filename, not coverMapping)
    const isNativeFormat = !metadata.coverMapping && metadata.books.some(b => b.coverKey)

    // Determine cover folder name
    const coverFolder = zip.file('cover_images/') ? 'cover_images' : 'covers'

    for (const exportBook of metadata.books) {
      const book: Record<string, unknown> = {
        id: exportBook.id,
        title: exportBook.title,
        author: exportBook.author,
        authorSortName: exportBook.author,
        createdAt: exportBook.createdAt,
        updatedAt: exportBook.updatedAt,
        tags: exportBook.tags || [],
        categoryIds: exportBook.categoryIds || [],
        readingSessionIds: []
      }

      // Copy all optional fields
      if (exportBook.isbn) book.isbn = exportBook.isbn
      if (exportBook.isbn10) book.isbn10 = exportBook.isbn10
      if (exportBook.isbn13) book.isbn13 = exportBook.isbn13
      if (exportBook.genre) book.genre = exportBook.genre
      if (exportBook.pageCount) book.pageCount = exportBook.pageCount
      if (exportBook.publicationYear) book.publicationYear = exportBook.publicationYear

      // Handle readingStatus - native app uses "Want to Read", "Read", etc.
      if (exportBook.readingStatus) {
        const statusMap: Record<string, string> = {
          'Want to Read': 'wantToRead',
          'Currently Reading': 'currentlyReading',
          'Read': 'read'
        }
        book.readingStatus = statusMap[exportBook.readingStatus] || exportBook.readingStatus.toLowerCase().replace(/\s+/g, '') as 'wantToRead' | 'currentlyReading' | 'read'
      }

      if (exportBook.rating) book.rating = exportBook.rating
      if (exportBook.publisher) book.publisher = exportBook.publisher
      if (exportBook.language) book.language = exportBook.language
      if (exportBook.subtitle) book.subtitle = exportBook.subtitle
      if (exportBook.customNotes) book.customNotes = exportBook.customNotes
      if (exportBook.purchaseDate) book.purchaseDate = exportBook.purchaseDate
      if (exportBook.purchasePrice !== undefined) book.purchasePrice = exportBook.purchasePrice
      if (exportBook.readingStartedAt) book.readingStartedAt = exportBook.readingStartedAt
      if (exportBook.finishedReadingAt) book.finishedReadingAt = exportBook.finishedReadingAt
      if (exportBook.totalReadingTimeSeconds !== undefined) book.totalReadingTimeSeconds = exportBook.totalReadingTimeSeconds
      if (exportBook.averageReadingTimePerDay !== undefined) book.averageReadingTimePerDay = exportBook.averageReadingTimePerDay
      if (exportBook.coverCropRect) book.coverCropRect = exportBook.coverCropRect
      if (exportBook.coverScale !== undefined) book.coverScale = exportBook.coverScale
      if (exportBook.coverOffset) book.coverOffset = exportBook.coverOffset

      // Handle cover images
      if (exportBook.coverFilename || exportBook.coverKey) {
        // Native format: coverKey is the filename base (e.g., "UUID")
        // PWA format: use coverMapping[bookId] or coverFilename
        let coverFilename: string | null = null

        if (isNativeFormat && exportBook.coverKey) {
          // Native format: coverKey is the actual filename without extension
          coverFilename = `${exportBook.coverKey}_cover.jpg`
        } else if (exportBook.coverFilename) {
          // PWA format
          coverFilename = metadata.coverMapping?.[exportBook.id] || exportBook.coverFilename
        }

        if (coverFilename) {
          // Try both cover_images/ (native) and covers/ (PWA) folders
          let coverFile = zip.file(`${coverFolder}/${coverFilename}`)
          if (!coverFile) {
            // Try the other folder
            coverFile = zip.file(`${coverFolder === 'cover_images' ? 'covers' : 'cover_images'}/${coverFilename}`)
          }

          if (coverFile) {
            const coverArrayBuffer = await coverFile.async('arraybuffer')
            const coverBlob = new Blob([coverArrayBuffer], { type: 'image/jpeg' })
            book.coverImageData = coverBlob

            // Generate thumbnail for list view
            try {
              const thumbnail = await coverImageService.generateThumbnail(coverBlob)
              book.coverThumbnailData = thumbnail
            } catch {
              console.warn(`Failed to generate thumbnail for book ${exportBook.id}`)
            }
          }
        }
      }

      books.push(book as unknown as Book)
    }

    result.books = books

    // Handle notes
    if (zip.file('notes.json')) {
      const notesText = await zip.file('notes.json')!.async('string')
      result.notes = JSON.parse(notesText)
    }

    // Handle categories
    if (zip.file('categories.json')) {
      const categoriesText = await zip.file('categories.json')!.async('string')
      result.categories = JSON.parse(categoriesText)
    }

    // Handle sessions
    if (zip.file('sessions.json')) {
      const sessionsText = await zip.file('sessions.json')!.async('string')
      result.sessions = JSON.parse(sessionsText)
    }

    return result
  }

  private async importData(data: Record<string, unknown>, strategy: ImportStrategy): Promise<{
    imported: number
    skipped: number
    errors: string[]
  }> {
    const errors: string[] = []
    let imported = 0
    let skipped = 0

    try {
      // Import books
      const books = data.books as Book[]
      if (books && Array.isArray(books)) {
        for (const book of books) {
          try {
            const existing = await bookRepository.getById(book.id)

            if (existing) {
              if (strategy === 'keepExisting') {
                skipped++
                continue
              } else if (strategy === 'keepBoth') {
                // Generate new ID for duplicate
                const newBook = { ...book, id: crypto.randomUUID() }
                await db.books.put(newBook)
                imported++
                continue
              }
              // Merge: update existing
              await bookRepository.update(book.id, book)
            } else {
              await db.books.put(book)
            }
            imported++
          } catch (error) {
            errors.push(`Failed to import book "${book.title}": ${error}`)
          }
        }
      }

      // Import notes
      const notes = data.notes as Note[]
      if (notes && Array.isArray(notes)) {
        for (const note of notes) {
          try {
            const existing = await noteRepository.getById(note.id)
            if (existing && strategy === 'keepExisting') {
              skipped++
              continue
            }
            await db.notes.put(note)
            imported++
          } catch (error) {
            errors.push(`Failed to import note: ${error}`)
          }
        }
      }

      // Import categories
      const categories = data.categories as BookCategory[]
      if (categories && Array.isArray(categories)) {
        for (const category of categories) {
          try {
            const existing = await categoryRepository.getById(category.id)
            if (existing && strategy === 'keepExisting') {
              skipped++
              continue
            }
            await db.categories.put(category)
            imported++
          } catch (error) {
            errors.push(`Failed to import category "${category.name}": ${error}`)
          }
        }
      }

      // Import reading sessions
      const sessions = data.sessions as ReadingSession[]
      if (sessions && Array.isArray(sessions)) {
        for (const session of sessions) {
          try {
            const existing = await sessionRepository.getById(session.id)
            if (existing && strategy === 'keepExisting') {
              skipped++
              continue
            }
            await db.readingSessions.put(session)
            imported++
          } catch (error) {
            errors.push(`Failed to import reading session: ${error}`)
          }
        }
      }
    } catch (error) {
      errors.push(`Import error: ${error}`)
    }

    return { imported, skipped, errors }
  }
}

export const exportService = ExportService.getInstance()
