import { db, generateId } from '../schema'
import type { Book, BookFilters, ReadingStatus } from '../../types'
import { useLiveQuery } from 'dexie-react-hooks'
import { generateBookSlug } from '../../utils/slug'

// Book repository
export const bookRepository = {
  async getAll(): Promise<Book[]> {
    return db.books.toArray()
  },

  async getById(id: string): Promise<Book | undefined> {
    return db.books.get(id)
  },

  async getBySlug(slug: string): Promise<Book | undefined> {
    return db.books.where('slug').equals(slug).first()
  },

  async getByISBN(isbn: string): Promise<Book | undefined> {
    return db.books
      .filter((book) => book.isbn === isbn || book.isbn10 === isbn || book.isbn13 === isbn)
      .first()
  },

  async create(book: Omit<Book, 'id' | 'slug' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = generateId()
    const slug = generateBookSlug(book.title, book.isbn)
    await db.books.add({
      ...book,
      id,
      slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return id
  },

  async updateSlug(id: string, title: string, isbn?: string): Promise<void> {
    const slug = generateBookSlug(title, isbn)
    await db.books.update(id, {
      slug,
      updatedAt: new Date().toISOString()
    })
  },

  async update(id: string, updates: Partial<Book>): Promise<void> {
    await db.books.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  },

  async delete(id: string): Promise<void> {
    // Delete related notes
    const notes = await db.notes.where('bookId').equals(id).toArray()
    for (const note of notes) {
      await db.notes.delete(note.id)
    }

    // Delete the book
    await db.books.delete(id)
  },

  async search(filters: BookFilters): Promise<Book[]> {
    let collection = db.books.toCollection()

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      collection = db.books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchLower) ||
          book.author.toLowerCase().includes(searchLower) ||
          (book.isbn && book.isbn.includes(searchLower)) ||
          (book.genre && book.genre.toLowerCase().includes(searchLower)) ||
          book.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      )
    }

    if (filters.status && filters.status !== 'all') {
      collection = collection.filter((book) => book.readingStatus === filters.status)
    }

    if (filters.genre) {
      collection = collection.filter((book) => book.genre === filters.genre)
    }

    if (filters.tags && filters.tags.length > 0) {
      collection = collection.filter((book) =>
        filters.tags!.some((tag) => book.tags.includes(tag))
      )
    }

    let books = await collection.toArray()

    // Apply sorting
    const sortBy = filters.sortBy || 'title'
    const sortOrder = filters.sortOrder || 'asc'

    books.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'author':
          comparison = a.author.localeCompare(b.author)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return books
  },

  async getByStatus(status: ReadingStatus): Promise<Book[]> {
    return db.books.where('readingStatus').equals(status).toArray()
  },

  async getGenres(): Promise<string[]> {
    const books = await db.books.toArray()
    const genres = new Set<string>()
    books.forEach((book) => {
      if (book.genre) genres.add(book.genre)
    })
    return Array.from(genres).sort()
  },

  async getAllTags(): Promise<string[]> {
    const books = await db.books.toArray()
    const tags = new Set<string>()
    books.forEach((book) => {
      book.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  },

  async getAuthors(): Promise<string[]> {
    const books = await db.books.toArray()
    const authors = new Set<string>()
    books.forEach((book) => {
      if (book.author) authors.add(book.author)
    })
    return Array.from(authors).sort()
  },

  async getPublishers(): Promise<string[]> {
    const books = await db.books.toArray()
    const publishers = new Set<string>()
    books.forEach((book) => {
      if (book.publisher) publishers.add(book.publisher)
    })
    return Array.from(publishers).sort()
  },

  async getLanguages(): Promise<string[]> {
    const books = await db.books.toArray()
    const languages = new Set<string>()
    books.forEach((book) => {
      if (book.language) languages.add(book.language)
    })
    return Array.from(languages).sort()
  },

  async getStatistics() {
    const books = await db.books.toArray()

    const booksByStatus: Record<string, number> = {
      wantToRead: 0,
      currentlyReading: 0,
      read: 0,
      total: books.length
    }

    const genreCount: Record<string, number> = {}
    const tagCount: Record<string, number> = {}
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let totalRating = 0
    let ratedBooks = 0

    books.forEach((book) => {
      if (book.readingStatus) {
        booksByStatus[book.readingStatus]++
      }
      if (book.genre) {
        genreCount[book.genre] = (genreCount[book.genre] || 0) + 1
      }
      book.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
      if (book.rating && book.rating >= 1 && book.rating <= 5) {
        ratingDistribution[book.rating]++
        totalRating += book.rating
        ratedBooks++
      }
    })

    return {
      booksByStatus,
      genreCount,
      tagCount,
      ratingDistribution,
      averageRating: ratedBooks > 0 ? totalRating / ratedBooks : 0,
      totalBooks: books.length
    }
  },

  // Live query for reactive updates
  liveAll() {
    return useLiveQuery(() => db.books.toArray())
  },

  liveSearch(filters: BookFilters) {
    return useLiveQuery(() => this.search(filters))
  }
}
