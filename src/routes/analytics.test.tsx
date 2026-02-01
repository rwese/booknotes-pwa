import { describe, it, expect } from 'vitest'

// Extract and test the helper functions independently
describe('formatReadingTime', () => {
  function formatReadingTime(ms: number): string {
    if (!ms) return '0h 0m'
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  it('formats zero milliseconds correctly', () => {
    expect(formatReadingTime(0)).toBe('0h 0m')
  })

  it('formats hours and minutes correctly', () => {
    // 2 hours 30 minutes in ms
    expect(formatReadingTime(2 * 60 * 60 * 1000 + 30 * 60 * 1000)).toBe('2h 30m')
  })

  it('formats only hours correctly', () => {
    expect(formatReadingTime(3 * 60 * 60 * 1000)).toBe('3h 0m')
  })

  it('handles undefined as zero', () => {
    expect(formatReadingTime(undefined as any)).toBe('0h 0m')
  })

  it('handles null as zero', () => {
    expect(formatReadingTime(null as any)).toBe('0h 0m')
  })

  it('formats 20 hours correctly', () => {
    expect(formatReadingTime(20 * 60 * 60 * 1000)).toBe('20h 0m')
  })

  it('formats 1 hour 45 minutes correctly', () => {
    expect(formatReadingTime(1 * 60 * 60 * 1000 + 45 * 60 * 1000)).toBe('1h 45m')
  })
})

describe('rating distribution calculation', () => {
  // Simulates the tagCount calculation from bookRepository
  function calculateTagCount(books: Array<{ tags: string[] }>): Record<string, number> {
    const tagCount: Record<string, number> = {}
    books.forEach((book) => {
      book.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })
    return tagCount
  }

  it('counts tags correctly', () => {
    const books = [
      { tags: ['classic', 'american'] },
      { tags: ['classic', 'dystopian'] },
      { tags: ['contemporary'] },
      { tags: ['self-help', 'classic'] },
    ]

    const result = calculateTagCount(books)

    expect(result['classic']).toBe(3)
    expect(result['american']).toBe(1)
    expect(result['dystopian']).toBe(1)
    expect(result['contemporary']).toBe(1)
    expect(result['self-help']).toBe(1)
  })

  it('handles empty books array', () => {
    const result = calculateTagCount([])
    expect(Object.keys(result).length).toBe(0)
  })

  it('handles books with no tags', () => {
    const result = calculateTagCount([{ tags: [] }, { tags: [] }])
    expect(Object.keys(result).length).toBe(0)
  })
})

describe('rating distribution calculation', () => {
  function calculateRatingDistribution(books: Array<{ rating?: number }>): Record<number, number> {
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    books.forEach((book) => {
      if (book.rating && book.rating >= 1 && book.rating <= 5) {
        ratingDistribution[book.rating]++
      }
    })
    return ratingDistribution
  }

  it('distributes ratings correctly', () => {
    const books = [
      { rating: 4 },
      { rating: 5 },
      { rating: 4 },
      { rating: undefined },
      { rating: 3 },
    ]

    const result = calculateRatingDistribution(books)

    expect(result[5]).toBe(1)
    expect(result[4]).toBe(2)
    expect(result[3]).toBe(1)
    expect(result[2]).toBe(0)
    expect(result[1]).toBe(0)
  })

  it('ignores invalid ratings', () => {
    const books = [
      { rating: 4 },
      { rating: 6 }, // invalid
      { rating: 0 }, // invalid
      { rating: -1 }, // invalid
    ]

    const result = calculateRatingDistribution(books)

    expect(result[4]).toBe(1)
    expect(result[5]).toBe(0)
    expect(result[6]).toBeUndefined()
  })
})

describe('books by status calculation', () => {
  function calculateBooksByStatus(books: Array<{ readingStatus?: string }>): Record<string, number> {
    const booksByStatus: Record<string, number> = {
      wantToRead: 0,
      currentlyReading: 0,
      read: 0,
      total: books.length,
    }

    books.forEach((book) => {
      if (book.readingStatus) {
        booksByStatus[book.readingStatus]++
      }
    })

    return booksByStatus
  }

  it('counts books by status', () => {
    const books = [
      { readingStatus: 'read' },
      { readingStatus: 'read' },
      { readingStatus: 'currentlyReading' },
      { readingStatus: 'wantToRead' },
      { readingStatus: undefined },
    ]

    const result = calculateBooksByStatus(books)

    expect(result.read).toBe(2)
    expect(result.currentlyReading).toBe(1)
    expect(result.wantToRead).toBe(1)
    expect(result.total).toBe(5)
  })

  it('handles empty array', () => {
    const result = calculateBooksByStatus([])

    expect(result.read).toBe(0)
    expect(result.currentlyReading).toBe(0)
    expect(result.wantToRead).toBe(0)
    expect(result.total).toBe(0)
  })
})

describe('reading speed calculation', () => {
  function calculateReadingSpeed(totalPages: number, totalTimeMs: number): number {
    const totalHours = totalTimeMs / (1000 * 60 * 60)
    return totalHours > 0 ? totalPages / totalHours : 0
  }

  it('calculates reading speed correctly', () => {
    // 125 pages over 4 hours = 31.25 pages/hour
    const speed = calculateReadingSpeed(125, 4 * 60 * 60 * 1000)
    expect(speed).toBeCloseTo(31.25, 1)
  })

  it('returns zero for zero time', () => {
    const speed = calculateReadingSpeed(100, 0)
    expect(speed).toBe(0)
  })

  it('returns zero for zero pages', () => {
    const speed = calculateReadingSpeed(0, 4 * 60 * 60 * 1000)
    expect(speed).toBe(0)
  })

  it('calculates fast reading speed', () => {
    // 100 pages over 1 hour = 100 pages/hour
    const speed = calculateReadingSpeed(100, 60 * 60 * 1000)
    expect(speed).toBe(100)
  })
})

describe('top tags sorting', () => {
  function getTopTags(tagCount: Record<string, number>, limit: number = 10): Array<[string, number]> {
    return Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
  }

  it('sorts tags by count descending', () => {
    const tagCount = {
      classic: 6,
      contemporary: 4,
      thriller: 3,
      romance: 2,
      historical: 2,
    }

    const result = getTopTags(tagCount)

    expect(result[0]).toEqual(['classic', 6])
    expect(result[1]).toEqual(['contemporary', 4])
    expect(result[2]).toEqual(['thriller', 3])
  })

  it('limits number of tags', () => {
    const tagCount = {
      tag1: 10,
      tag2: 9,
      tag3: 8,
      tag4: 7,
      tag5: 6,
      tag6: 5,
      tag7: 4,
      tag8: 3,
      tag9: 2,
      tag10: 1,
      tag11: 0,
    }

    const result = getTopTags(tagCount, 5)

    expect(result.length).toBe(5)
    expect(result[4][0]).toBe('tag5')
  })

  it('handles empty object', () => {
    const result = getTopTags({})
    expect(result.length).toBe(0)
  })
})
