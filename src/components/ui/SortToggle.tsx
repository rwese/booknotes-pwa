import { useState, useRef, useEffect, useCallback } from 'react'
import './SortToggle.css'

export type SortOption = 'title' | 'author' | 'createdAt' | 'updatedAt' | 'rating'

interface SortToggleProps {
  sortBy: SortOption
  sortOrder: 'asc' | 'desc'
  onSortChange: (sortBy: SortOption, sortOrder: 'asc' | 'desc') => void
}

export function SortToggle({ sortBy, sortOrder, onSortChange }: SortToggleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const options: { value: SortOption; label: string }[] = [
    { value: 'title', label: 'Title' },
    { value: 'author', label: 'Author' },
    { value: 'createdAt', label: 'Date Added' },
    { value: 'updatedAt', label: 'Date Updated' },
    { value: 'rating', label: 'Rating' }
  ]

  const handleOptionClick = useCallback((option: SortOption) => {
    if (option === sortBy) {
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(option, 'asc')
    }
    setIsOpen(false)
  }, [sortBy, sortOrder, onSortChange])

  const toggleOrder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
  }, [sortBy, sortOrder, onSortChange])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

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

  return (
    <>
      <div className="sort-toggle-container">
        <button
          className={`filter-toggle ${isOpen ? 'filter-toggle--active' : ''}`}
          onClick={() => setIsOpen(true)}
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
      </div>

      {isOpen && (
        <div className="sort-modal-overlay" onClick={handleClose}>
          <div
            className="sort-modal"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Sort options"
          >
            <div className="sort-modal__header">
              <h3 className="sort-modal__title">Sort by</h3>
              <button
                type="button"
                className="sort-modal__close"
                onClick={handleClose}
                aria-label="Close sort menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="sort-modal__content">
              {options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`sort-modal__item ${option.value === sortBy ? 'sort-modal__item--active' : ''}`}
                  onClick={() => handleOptionClick(option.value)}
                  aria-pressed={option.value === sortBy}
                >
                  <span className="sort-modal__item-label">{option.label}</span>
                  {option.value === sortBy && (
                    <svg
                      className="sort-modal__check"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}

              <div className="sort-modal__divider" />

              <button
                type="button"
                className="sort-modal__item"
                onClick={toggleOrder}
              >
                <span className="sort-modal__item-label">
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </span>
                <svg
                  className="sort-modal__arrow-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease'
                  }}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
