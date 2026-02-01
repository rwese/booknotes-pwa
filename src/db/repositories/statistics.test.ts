import { describe, it, expect } from 'vitest'
import type { Book, ReadingSession } from '../../types'

// These tests verify the statistical calculation logic
// They don't need the actual database since they test pure calculation logic

describe('Book Statistics Logic', () => {
  // Simulates the getStatistics calculation
  function calculateBookStats(books: Book[]) {
    const booksByStatus: Record<string, number> = {
      wantToRead: 0,
      currentlyReading: 0,
      read: 0,
      total: books.length,
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
      book.tags.forEach((tag: string) => {
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
      totalBooks: books.length,
    }
  }

  it('calculates total books correctly', () => {
    const books: Book[] = [
      { id: '1', title: 'Book 1', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
      { id: '2', title: 'Book 2', author: 'Author', authorSortName: '', readingStatus: 'wantToRead', pageCount: 100, tags: [], categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
    ]
    const stats = calculateBookStats(books)
    expect(stats.totalBooks).toBe(2)
  })

  it('counts books by reading status', () => {
    const books: Book[] = [
      { id: '1', title: 'Book 1', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
      { id: '2', title: 'Book 2', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
      { id: '3', title: 'Book 3', author: 'Author', authorSortName: '', readingStatus: 'currentlyReading', pageCount: 100, tags: [], categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
      { id: '4', title: 'Book 4', author: 'Author', authorSortName: '', readingStatus: 'wantToRead', pageCount: 100, tags: [], categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
    ]
    const stats = calculateBookStats(books)
    expect(stats.booksByStatus.read).toBe(2)
    expect(stats.booksByStatus.currentlyReading).toBe(1)
    expect(stats.booksByStatus.wantToRead).toBe(1)
  })

  it('counts tags correctly', () => {
    const books: Book[] = [
      { id: '1', title: 'Book 1', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: ['classic', 'fiction'], categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
      { id: '2', title: 'Book 2', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: ['classic', 'historical'], categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
      { id: '3', title: 'Book 3', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: ['fiction'], categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
    ]
    const stats = calculateBookStats(books)
    expect(stats.tagCount['classic']).toBe(2)
    expect(stats.tagCount['fiction']).toBe(2)
    expect(stats.tagCount['historical']).toBe(1)
  })

  it('calculates rating distribution', () => {
    const books: Book[] = [
      { id: '1', title: 'Book 1', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], rating: 5, categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
      { id: '2', title: 'Book 2', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], rating: 4, categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
      { id: '3', title: 'Book 3', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], rating: 4, categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
    ]
    const stats = calculateBookStats(books)
    expect(stats.ratingDistribution[5]).toBe(1)
    expect(stats.ratingDistribution[4]).toBe(2)
    expect(stats.ratingDistribution[3]).toBe(0)
  })

  it('calculates average rating', () => {
    const books: Book[] = [
      { id: '1', title: 'Book 1', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], rating: 5, categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
      { id: '2', title: 'Book 2', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], rating: 3, categoryIds: [], readingSessionIds: [], createdAt: '', updatedAt: '' },
    ]
    const stats = calculateBookStats(books)
    expect(stats.averageRating).toBe(4) // (5 + 3) / 2 = 4
  })

  it('handles empty database', () => {
    const stats = calculateBookStats([])
    expect(stats.totalBooks).toBe(0)
    expect(stats.booksByStatus.read).toBe(0)
    expect(stats.booksByStatus.currentlyReading).toBe(0)
    expect(stats.booksByStatus.wantToRead).toBe(0)
    expect(Object.keys(stats.genreCount).length).toBe(0)
    expect(Object.keys(stats.tagCount).length).toBe(0)
    expect(stats.averageRating).toBe(0)
  })
})

describe('Session Statistics Logic', () => {
  function calculateSessionStats(sessions: ReadingSession[]) {
    const byMonth: Record<string, { sessions: number; pages: number }> = {}

    sessions.forEach((session) => {
      const month = session.startDate.substring(0, 7) // YYYY-MM
      if (!byMonth[month]) {
        byMonth[month] = { sessions: 0, pages: 0 }
      }
      byMonth[month].sessions++
      byMonth[month].pages += session.pagesRead
    })

    const totalSessions = sessions.length
    const totalPages = sessions.reduce((sum, s) => sum + s.pagesRead, 0)
    const totalTime = sessions.reduce((sum, s) => {
      if (s.endDate) {
        return sum + (new Date(s.endDate).getTime() - new Date(s.startDate).getTime())
      }
      return sum
    }, 0)

    const totalHours = totalTime / (1000 * 60 * 60)
    const readingSpeed = totalHours > 0 ? totalPages / totalHours : 0

    return {
      totalSessions,
      totalPages,
      totalTime,
      byMonth,
      averagePagesPerSession: totalSessions > 0 ? totalPages / totalSessions : 0,
      readingSpeed,
    }
  }

  it('calculates total sessions', () => {
    const sessions: ReadingSession[] = [
      { id: '1', bookId: 'b1', startDate: '2024-01-01T10:00:00Z', endDate: '2024-01-01T11:00:00Z', pagesRead: 50, createdAt: '' },
      { id: '2', bookId: 'b2', startDate: '2024-01-02T10:00:00Z', endDate: '2024-01-02T11:00:00Z', pagesRead: 30, createdAt: '' },
    ]
    const stats = calculateSessionStats(sessions)
    expect(stats.totalSessions).toBe(2)
  })

  it('calculates total pages', () => {
    const sessions: ReadingSession[] = [
      { id: '1', bookId: 'b1', startDate: '2024-01-01T10:00:00Z', endDate: '2024-01-01T11:00:00Z', pagesRead: 50, createdAt: '' },
      { id: '2', bookId: 'b2', startDate: '2024-01-02T10:00:00Z', endDate: '2024-01-02T11:00:00Z', pagesRead: 30, createdAt: '' },
    ]
    const stats = calculateSessionStats(sessions)
    expect(stats.totalPages).toBe(80)
  })

  it('groups sessions by month', () => {
    const sessions: ReadingSession[] = [
      { id: '1', bookId: 'b1', startDate: '2024-01-15T10:00:00Z', endDate: '2024-01-15T11:00:00Z', pagesRead: 50, createdAt: '' },
      { id: '2', bookId: 'b2', startDate: '2024-01-20T10:00:00Z', endDate: '2024-01-20T11:00:00Z', pagesRead: 30, createdAt: '' },
      { id: '3', bookId: 'b3', startDate: '2024-02-10T10:00:00Z', endDate: '2024-02-10T11:00:00Z', pagesRead: 45, createdAt: '' },
    ]
    const stats = calculateSessionStats(sessions)
    expect(stats.byMonth['2024-01']).toEqual({ sessions: 2, pages: 80 })
    expect(stats.byMonth['2024-02']).toEqual({ sessions: 1, pages: 45 })
  })

  it('calculates reading speed', () => {
    // Session 1: 1 hour, 50 pages
    // Session 2: 1 hour, 50 pages
    // Total: 100 pages / 2 hours = 50 pages/hour
    const sessions: ReadingSession[] = [
      { id: '1', bookId: 'b1', startDate: '2024-01-01T10:00:00Z', endDate: '2024-01-01T11:00:00Z', pagesRead: 50, createdAt: '' },
      { id: '2', bookId: 'b2', startDate: '2024-01-02T10:00:00Z', endDate: '2024-01-02T11:00:00Z', pagesRead: 50, createdAt: '' },
    ]
    const stats = calculateSessionStats(sessions)
    expect(stats.readingSpeed).toBe(50)
  })

  it('calculates average pages per session', () => {
    const sessions: ReadingSession[] = [
      { id: '1', bookId: 'b1', startDate: '2024-01-01T10:00:00Z', endDate: '2024-01-01T11:00:00Z', pagesRead: 50, createdAt: '' },
      { id: '2', bookId: 'b2', startDate: '2024-01-02T10:00:00Z', endDate: '2024-01-02T11:00:00Z', pagesRead: 30, createdAt: '' },
      { id: '3', bookId: 'b3', startDate: '2024-01-03T10:00:00Z', endDate: '2024-01-03T11:00:00Z', pagesRead: 40, createdAt: '' },
    ]
    const stats = calculateSessionStats(sessions)
    expect(stats.averagePagesPerSession).toBe(40) // (50 + 30 + 40) / 3
  })

  it('handles sessions without endDate', () => {
    const sessions: ReadingSession[] = [
      { id: '1', bookId: 'b1', startDate: '2024-01-01T10:00:00Z', endDate: undefined, pagesRead: 20, createdAt: '' },
    ]
    const stats = calculateSessionStats(sessions)
    expect(stats.totalSessions).toBe(1)
    expect(stats.totalPages).toBe(20)
    expect(stats.totalTime).toBe(0)
    expect(stats.readingSpeed).toBe(0)
  })

  it('handles empty database', () => {
    const stats = calculateSessionStats([])
    expect(stats.totalSessions).toBe(0)
    expect(stats.totalPages).toBe(0)
    expect(stats.totalTime).toBe(0)
    expect(stats.readingSpeed).toBe(0)
    expect(stats.averagePagesPerSession).toBe(0)
  })
})
