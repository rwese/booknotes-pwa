import { db, generateId } from '../schema'
import type { Book, BookFilters, ReadingStatus } from '../../types'
import { useLiveQuery } from 'dexie-react-hooks'

// Book repository
export const bookRepository = {
  async getAll(): Promise<Book[]> {
    return db.books.toArray()
  },

  async getById(id: string): Promise<Book | undefined> {
    return db.books.get(id)
  },

  async getByISBN(isbn: string): Promise<Book | undefined> {
    return db.books
      .filter((book) => book.isbn === isbn || book.isbn10 === isbn || book.isbn13 === isbn)
      .first()
  },

  async create(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = generateId()
    await db.books.add({
      ...book,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return id
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

    // Delete related reading sessions
    const sessions = await db.readingSessions.where('bookId').equals(id).toArray()
    for (const session of sessions) {
      await db.readingSessions.delete(session.id)
    }

    // Remove book ID from categories
    const categories = await db.categories.toArray()
    for (const category of categories) {
      if (category.bookIds.includes(id)) {
        await db.categories.update(category.id, {
          bookIds: category.bookIds.filter((bid) => bid !== id)
        })
      }
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

    if (filters.categoryId) {
      const categoryId = filters.categoryId
      collection = collection.filter((book) => book.categoryIds.includes(categoryId))
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
