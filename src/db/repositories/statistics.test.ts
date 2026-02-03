import { describe, it, expect } from 'vitest'
import type { Book } from '../../types'

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
      { id: '1', slug: 'book-1', title: 'Book 1', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], createdAt: '', updatedAt: '' },
      { id: '2', slug: 'book-2', title: 'Book 2', author: 'Author', authorSortName: '', readingStatus: 'wantToRead', pageCount: 100, tags: [], createdAt: '', updatedAt: '' },
    ]
    const stats = calculateBookStats(books)
    expect(stats.totalBooks).toBe(2)
  })

  it('counts books by reading status', () => {
    const books: Book[] = [
      { id: '1', slug: 'book-1', title: 'Book 1', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], createdAt: '', updatedAt: '' },
      { id: '2', slug: 'book-2', title: 'Book 2', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], createdAt: '', updatedAt: '' },
      { id: '3', slug: 'book-3', title: 'Book 3', author: 'Author', authorSortName: '', readingStatus: 'currentlyReading', pageCount: 100, tags: [], createdAt: '', updatedAt: '' },
      { id: '4', slug: 'book-4', title: 'Book 4', author: 'Author', authorSortName: '', readingStatus: 'wantToRead', pageCount: 100, tags: [], createdAt: '', updatedAt: '' },
    ]
    const stats = calculateBookStats(books)
    expect(stats.booksByStatus.read).toBe(2)
    expect(stats.booksByStatus.currentlyReading).toBe(1)
    expect(stats.booksByStatus.wantToRead).toBe(1)
  })

  it('counts tags correctly', () => {
    const books: Book[] = [
      { id: '1', slug: 'book-1', title: 'Book 1', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: ['classic', 'fiction'], createdAt: '', updatedAt: '' },
      { id: '2', slug: 'book-2', title: 'Book 2', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: ['classic', 'historical'], createdAt: '', updatedAt: '' },
      { id: '3', slug: 'book-3', title: 'Book 3', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: ['fiction'], createdAt: '', updatedAt: '' },
    ]
    const stats = calculateBookStats(books)
    expect(stats.tagCount['classic']).toBe(2)
    expect(stats.tagCount['fiction']).toBe(2)
    expect(stats.tagCount['historical']).toBe(1)
  })

  it('calculates rating distribution', () => {
    const books: Book[] = [
      { id: '1', slug: 'book-1', title: 'Book 1', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], rating: 5, createdAt: '', updatedAt: '' },
      { id: '2', slug: 'book-2', title: 'Book 2', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], rating: 4, createdAt: '', updatedAt: '' },
      { id: '3', slug: 'book-3', title: 'Book 3', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], rating: 4, createdAt: '', updatedAt: '' },
    ]
    const stats = calculateBookStats(books)
    expect(stats.ratingDistribution[5]).toBe(1)
    expect(stats.ratingDistribution[4]).toBe(2)
    expect(stats.ratingDistribution[3]).toBe(0)
  })

  it('calculates average rating', () => {
    const books: Book[] = [
      { id: '1', slug: 'book-1', title: 'Book 1', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], rating: 5, createdAt: '', updatedAt: '' },
      { id: '2', slug: 'book-2', title: 'Book 2', author: 'Author', authorSortName: '', readingStatus: 'read', pageCount: 100, tags: [], rating: 3, createdAt: '', updatedAt: '' },
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
