import { useMemo, useRef, useEffect, useState } from 'react'
import type { Book } from '../../types'
import './FilterPanel.css'

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  books: Book[]
  statusFilter: string
  genreFilter: string
  tagFilter: string
  ratingFilter: number
  onStatusChange: (status: string) => void
  onGenreChange: (genre: string) => void
  onTagChange: (tag: string) => void
  onRatingChange: (rating: number) => void
  onClear: () => void
  activeFilterCount: number
}

const MAX_VISIBLE_ITEMS = 6

export function FilterPanel({
  isOpen,
  onClose,
  books,
  statusFilter,
  genreFilter,
  tagFilter,
  ratingFilter,
  onStatusChange,
  onGenreChange,
  onTagChange,
  onRatingChange,
  onClear,
  activeFilterCount
}: FilterPanelProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [genreSearch, setGenreSearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')

  // Get unique genres and tags from books
  const genres = useMemo(() => {
    const genreSet = new Set<string>()
    books.forEach(book => {
      if (book.genre) genreSet.add(book.genre)
    })
    return Array.from(genreSet).sort()
  }, [books])

  const tags = useMemo(() => {
    const tagSet = new Set<string>()
    books.forEach(book => {
      if (book.tags) {
        book.tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [books])

  // Filter genres based on search
  const filteredGenres = useMemo(() => {
    if (!genreSearch) return genres
    const search = genreSearch.toLowerCase()
    return genres.filter(genre => genre.toLowerCase().includes(search))
  }, [genres, genreSearch])

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    if (!tagSearch) return tags
    const search = tagSearch.toLowerCase()
    return tags.filter(tag => tag.toLowerCase().includes(search))
  }, [tags, tagSearch])

  // Get visible items (limited)
  const visibleGenres = filteredGenres.slice(0, MAX_VISIBLE_ITEMS)
  const visibleTags = filteredTags.slice(0, MAX_VISIBLE_ITEMS)
  const hasMoreGenres = filteredGenres.length > MAX_VISIBLE_ITEMS
  const hasMoreTags = filteredTags.length > MAX_VISIBLE_ITEMS

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Reset search when panel closes
  useEffect(() => {
    if (!isOpen) {
      setGenreSearch('')
      setTagSearch('')
    }
  }, [isOpen])

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'wantToRead', label: 'Want to Read' },
    { value: 'currentlyReading', label: 'Reading' },
    { value: 'read', label: 'Read' }
  ]

  // Rating options
  const ratingOptions = [
    { value: 0, label: 'All Ratings' },
    { value: 5, label: '5 Stars' },
    { value: 4, label: '4 Stars' },
    { value: 3, label: '3 Stars' },
    { value: 2, label: '2 Stars' },
    { value: 1, label: '1 Star' }
  ]

  const renderSection = (
    title: string,
    children: React.ReactNode
  ) => (
    <div className="filter-panel__section">
      <h4 className="filter-panel__section-title">{title}</h4>
      {children}
    </div>
  )

  const renderSearchSelect = (
    label: string,
    searchValue: string,
    onSearchChange: (value: string) => void,
    options: string[],
    selectedValue: string,
    onOptionSelect: (value: string) => void,
    emptyLabel: string,
    visibleItems: string[],
    hasMore: boolean
  ) => (
    <div className="filter-panel__search-select">
      <div className="filter-panel__search">
        <svg
          className="filter-panel__search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={`Search ${label.toLowerCase()}...`}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="filter-panel__search-input"
          aria-label={`Search ${label.toLowerCase()}`}
        />
        {searchValue && (
          <button
            type="button"
            className="filter-panel__search-clear"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      <div className="filter-panel__options" role="listbox" aria-label={`Select ${label.toLowerCase()}`}>
        <button
          type="button"
          className={`filter-panel__option ${!selectedValue ? 'filter-panel__option--active' : ''}`}
          onClick={() => onOptionSelect('')}
          role="option"
          aria-selected={!selectedValue}
        >
          {emptyLabel}
        </button>
        {visibleItems.map(option => (
          <button
            key={option}
            type="button"
            className={`filter-panel__option ${selectedValue === option ? 'filter-panel__option--active' : ''}`}
            onClick={() => onOptionSelect(option)}
            role="option"
            aria-selected={selectedValue === option}
          >
            {option}
          </button>
        ))}
        {options.length === 0 && (
          <div className="filter-panel__empty">
            No {label.toLowerCase()}s found
          </div>
        )}
        {hasMore && (
          <div className="filter-panel__more">
            +{options.length - MAX_VISIBLE_ITEMS} more
          </div>
        )}
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="filter-panel-overlay" onClick={onClose}>
      <div
        className="filter-panel"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Filter options"
      >
        <div className="filter-panel__header">
          <h3 className="filter-panel__title">Filters</h3>
          <button
            type="button"
            className="filter-panel__close"
            onClick={onClose}
            aria-label="Close filters"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="filter-panel__content">
          {renderSection(
            'Reading Status',
            <div className="filter-panel__buttons">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`filter-panel__btn ${statusFilter === option.value ? 'filter-panel__btn--active' : ''}`}
                  onClick={() => onStatusChange(option.value)}
                  aria-pressed={statusFilter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {renderSection(
            'Rating',
            <div className="filter-panel__buttons">
              {ratingOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`filter-panel__btn ${ratingFilter === option.value ? 'filter-panel__btn--active' : ''}`}
                  onClick={() => onRatingChange(option.value)}
                  aria-pressed={ratingFilter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {genres.length > 0 && renderSection(
            'Genre',
            renderSearchSelect(
              'Genre',
              genreSearch,
              setGenreSearch,
              filteredGenres,
              genreFilter,
              onGenreChange,
              'All Genres',
              visibleGenres,
              hasMoreGenres
            )
          )}

          {tags.length > 0 && renderSection(
            'Tag',
            renderSearchSelect(
              'Tag',
              tagSearch,
              setTagSearch,
              filteredTags,
              tagFilter,
              onTagChange,
              'All Tags',
              visibleTags,
              hasMoreTags
            )
          )}
        </div>

        <div className="filter-panel__footer">
          <button
            type="button"
            className="filter-panel__clear"
            onClick={onClear}
            disabled={activeFilterCount === 0}
          >
            Clear all filters
          </button>
          <button
            type="button"
            className="filter-panel__apply"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
