import { useState, useRef, useEffect } from 'react'

export type SortOption = 'title' | 'author' | 'createdAt' | 'updatedAt' | 'rating'

interface SortToggleProps {
  sortBy: SortOption
  sortOrder: 'asc' | 'desc'
  onSortChange: (sortBy: SortOption, sortOrder: 'asc' | 'desc') => void
}

export function SortToggle({ sortBy, sortOrder, onSortChange }: SortToggleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const options: { value: SortOption; label: string }[] = [
    { value: 'title', label: 'Title' },
    { value: 'author', label: 'Author' },
    { value: 'createdAt', label: 'Date Added' },
    { value: 'updatedAt', label: 'Date Updated' },
    { value: 'rating', label: 'Rating' }
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionClick = (option: SortOption) => {
    if (option === sortBy) {
      // Toggle order if same option
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New option, default to ascending
      onSortChange(option, 'asc')
    }
    setIsOpen(false)
  }

  const toggleOrder = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="sort-toggle-container" ref={dropdownRef}>
      <button
        className={`filter-toggle ${isOpen ? 'filter-toggle--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Sort options"
        title="Sort"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="16" y2="12" />
          <line x1="4" y1="18" x2="12" y2="18" />
        </svg>
        <svg
          className="sort-toggle__arrow"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease'
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="sort-dropdown">
          {options.map(option => (
            <button
              key={option.value}
              className={`sort-dropdown__item ${option.value === sortBy ? 'sort-dropdown__item--active' : ''}`}
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
              {option.value === sortBy && (
                <svg
                  className="sort-dropdown__check"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
          <div className="sort-dropdown__divider" />
          <button
            className="sort-dropdown__item"
            onClick={toggleOrder}
          >
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            <svg
              className="sort-dropdown__arrow-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease'
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
