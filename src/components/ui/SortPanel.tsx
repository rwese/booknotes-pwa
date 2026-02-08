import { useRef, useEffect, useCallback } from 'react'
import type { SortOption } from './SortButton'
import './SortPanel.css'
import { useBottomSheet } from '../../hooks/useBottomSheet'

interface SortPanelProps {
  isOpen: boolean
  onClose: () => void
  sortBy: SortOption
  sortOrder: 'asc' | 'desc'
  onSortChange: (sortBy: SortOption, sortOrder: 'asc' | 'desc') => void
}

export function SortPanel({ 
  isOpen, 
  onClose, 
  sortBy, 
  sortOrder, 
  onSortChange 
}: SortPanelProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { setBottomSheetOpen } = useBottomSheet()

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
    onClose()
  }, [sortBy, sortOrder, onSortChange, onClose])

  const toggleOrder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
    onClose()
  }, [sortBy, sortOrder, onSortChange, onClose])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

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

  // Prevent body scroll when modal is open and update bottom sheet state
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setBottomSheetOpen(true)
    } else {
      document.body.style.overflow = ''
      setBottomSheetOpen(false)
    }
    return () => {
      document.body.style.overflow = ''
      setBottomSheetOpen(false)
    }
  }, [isOpen, setBottomSheetOpen])

  if (!isOpen) return null

  return (
    <div className="sort-panel-overlay" onClick={handleClose}>
      <div
        className="sort-panel"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sort options"
      >
        <div className="sort-panel__header">
          <h3 className="sort-panel__title">Sort by</h3>
          <button
            type="button"
            className="sort-panel__close"
            onClick={handleClose}
            aria-label="Close sort menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="sort-panel__content">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              className={`sort-panel__item ${option.value === sortBy ? 'sort-panel__item--active' : ''}`}
              onClick={() => handleOptionClick(option.value)}
              aria-pressed={option.value === sortBy}
            >
              <span className="sort-panel__item-label">{option.label}</span>
              {option.value === sortBy && (
                <svg
                  className="sort-panel__check"
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

          <div className="sort-panel__divider" />

          <button
            type="button"
            className="sort-panel__item"
            onClick={toggleOrder}
          >
            <span className="sort-panel__item-label">
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </span>
            <svg
              className="sort-panel__arrow-icon"
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
  )
}