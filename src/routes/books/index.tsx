import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAllBooks } from '../../hooks/useBooks'
import { useViewPreference } from '../../hooks/useViewPreference'
import { useHashParams } from '../../hooks/useHashParams'
import { ViewToggle } from '../../components/ui/ViewToggle'
import { FilterToggle } from '../../components/ui/FilterToggle'
import { SortToggle, type SortOption } from '../../components/ui/SortToggle'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { BookGridCard } from '../../components/books/BookGridCard'
import '../../components/books/BookList.css'
import type { Book } from '../../types'

export function BooksIndex() {
  const navigate = useNavigate()
  const { data: books, isLoading, error } = useAllBooks()
  const [globalFilter, setGlobalFilter] = useState('')
  const [viewMode, setViewMode] = useViewPreference('list')
  const [showSearch, setShowSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const { params, setParams, clearParams } = useHashParams()
  const [sortBy, setSortBy] = useState<SortOption>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Initialize sort params from hash
  useEffect(() => {
    if (params.sortBy) {
      setSortBy((params.sortBy as SortOption) || 'title')
    }
    if (params.sortOrder) {
      setSortOrder((params.sortOrder as 'asc' | 'desc') || 'asc')
    }
  }, [params.sortBy, params.sortOrder])

  const handleSortChange = useCallback((newSortBy: SortOption, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setParams({ sortBy: newSortBy, sortOrder: newSortOrder })
  }, [setParams])

  // Track cover blob URLs for cleanup
  const coverUrlsRef = useRef<Map<string, string>>(new Map())

  const getCoverUrl = useCallback((book: Book): string | null => {
    const coverData = book.coverThumbnailData || book.coverImageData
    if (!coverData) return null

    // Reuse existing URL if we have one for this book
    const existing = coverUrlsRef.current.get(book.id)
    if (existing) return existing

    // Create new URL and cache it
    const url = URL.createObjectURL(coverData)
    coverUrlsRef.current.set(book.id, url)
    return url
  }, [])

  // Cleanup URLs on unmount
  useEffect(() => {
    const urlsRef = coverUrlsRef.current
    return () => {
      urlsRef.forEach(url => URL.revokeObjectURL(url))
      urlsRef.clear()
    }
  }, [])

  // Extract filter values from hash params
  const statusFilter = params.status || 'all'
  const genreFilter = params.genre || ''
  const tagFilter = params.tag || ''
  const ratingFilter = params.rating ? parseInt(params.rating, 10) : 0

  // Count active filters for the badge
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'all') count++
    if (genreFilter) count++
    if (tagFilter) count++
    if (ratingFilter > 0) count++
    if (globalFilter) count++
    return count
  }, [statusFilter, genreFilter, tagFilter, ratingFilter, globalFilter])

  // Filter handlers
  const handleStatusChange = useCallback((status: string) => {
    setParams({ status: status === 'all' ? '' : status })
  }, [setParams])

  const handleGenreChange = useCallback((genre: string) => {
    setParams({ genre })
  }, [setParams])

  const handleTagChange = useCallback((tag: string) => {
    setParams({ tag })
  }, [setParams])

  const handleRatingChange = useCallback((rating: number) => {
    setParams({ rating: rating === 0 ? '' : rating.toString() })
  }, [setParams])

  const handleClearFilters = useCallback(() => {
    clearParams()
    setGlobalFilter('')
    setShowFilters(false)
    // Reset sort to defaults
    setSortBy('title')
    setSortOrder('asc')
  }, [clearParams])

  const filteredBooks = useMemo(() => {
    if (!books) return []
    let result = books

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(b => b.readingStatus === statusFilter)
    }

    // Genre filter
    if (genreFilter) {
      result = result.filter(b => b.genre === genreFilter)
    }

    // Tag filter
    if (tagFilter) {
      result = result.filter(b => b.tags?.includes(tagFilter))
    }

    // Rating filter
    if (ratingFilter > 0) {
      result = result.filter(b => b.rating === ratingFilter)
    }

    // Search filter
    if (globalFilter) {
      const search = globalFilter.toLowerCase()
      result = result.filter(b =>
        b.title.toLowerCase().includes(search) ||
        b.author.toLowerCase().includes(search)
      )
    }

    return result
  }, [books, statusFilter, genreFilter, tagFilter, ratingFilter, globalFilter])

  // Apply sorting to filtered books
  const sortedBooks = useMemo(() => {
    const booksToSort = [...filteredBooks]
    booksToSort.sort((a, b) => {
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
        default:
          comparison = 0
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
    return booksToSort
  }, [filteredBooks, sortBy, sortOrder])

  const handleBookClick = (book: Book) => {
    navigate({ to: '/books/$bookSlug', params: { bookSlug: book.slug || book.id } })
  }

  const handleAddBook = () => {
    navigate({ to: '/books/new' })
  }

  if (isLoading) {
    return (
      <div className="p-5">
        <div className="skeleton h-[60px] mb-2" />
        <div className="skeleton h-24 mb-2" />
        <div className="skeleton h-24 mb-2" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error loading books: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="books-page">
      <h1 className="sr-only">Books</h1>
      <div className="page-header">
        {showSearch ? (
          <div className="search-input-container">
            <button
              type="button"
              className="search-close"
              onClick={() => {
                setShowSearch(false)
                setGlobalFilter('')
              }}
              aria-label="Close search"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Search books..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="form-input search-input"
            />
          </div>
        ) : (
          <div className="filter-bar__controls">
            <button
              type="button"
              className="search-toggle"
              onClick={() => setShowSearch(true)}
              aria-label="Open search"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <div className="filter-bar__spacer" />
            <div className="filter-bar__actions">
              <SortToggle
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />
              <FilterToggle
                isOpen={showFilters}
                onToggle={() => setShowFilters(!showFilters)}
                activeCount={activeFilterCount}
              />
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        )}
      </div>

      <button type="button" className="fab" onClick={handleAddBook} aria-label="Add Book">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Mobile-friendly filter panel */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        books={books || []}
        statusFilter={statusFilter}
        genreFilter={genreFilter}
        tagFilter={tagFilter}
        ratingFilter={ratingFilter}
        onStatusChange={handleStatusChange}
        onGenreChange={handleGenreChange}
        onTagChange={handleTagChange}
        onRatingChange={handleRatingChange}
        onClear={handleClearFilters}
        activeFilterCount={activeFilterCount}
      />

      {books?.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <div className="empty-state-title">No books yet</div>
          <div className="empty-state-description">
            Start adding books to your collection by tapping the Add Book button.
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="book-grid">
          {sortedBooks.map((book) => (
            <BookGridCard
              key={book.id}
              book={book}
              onClick={() => handleBookClick(book)}
            />
          ))}
        </div>
      ) : (
        <div className="book-list">
          {sortedBooks.map((book) => {
            const coverUrl = getCoverUrl(book)
            const statusClass = book.readingStatus ? {
              wantToRead: 'badge badge--status-want',
              currentlyReading: 'badge badge--status-reading',
              read: 'badge badge--status-read'
            }[book.readingStatus] : null
            const statusLabel = book.readingStatus ? {
              wantToRead: 'Want to Read',
              currentlyReading: 'Reading',
              read: 'Read'
            }[book.readingStatus] : null

            // Build metadata line
            const metaParts = [
              book.author,
              book.publicationYear,
              book.pageCount && `${book.pageCount} pp`,
              book.genre
            ].filter(Boolean)

            return (
              <div
                key={book.id}
                className="book-list-item"
                onClick={() => handleBookClick(book)}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`${book.title} cover`}
                    className="book-list-item__cover"
                  />
                ) : (
                  <div className="book-list-item__cover book-list-item__cover--placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                )}
                <div className="book-list-item__content">
                  <div className="book-list-item__row1">
                    <span className="book-list-item__title">{book.title}</span>
                    <div className="book-list-item__meta-right">
                      {book.rating && (
                        <div className="book-list-item__rating">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`star ${i < book.rating! ? '' : 'empty'}`}
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                      )}
                      {statusClass && statusLabel && (
                        <span className={statusClass}>{statusLabel}</span>
                      )}
                    </div>
                  </div>
                  <div className="book-list-item__row2">
                    {metaParts.join(' · ')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
