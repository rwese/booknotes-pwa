import './SortButton.css'

export type SortOption = 'title' | 'author' | 'createdAt' | 'updatedAt' | 'rating'

interface SortButtonProps {
  isOpen: boolean
  onToggle: () => void
  sortBy: SortOption
  sortOrder: 'asc' | 'desc'
}

export function SortButton({ isOpen, onToggle, sortBy, sortOrder }: SortButtonProps) {
  return (
    <button
      className={`sort-button ${isOpen ? 'sort-button--active' : ''}`}
      onClick={onToggle}
      aria-label="Sort options"
      title="Sort"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="16" y2="12" />
        <line x1="4" y1="18" x2="12" y2="18" />
      </svg>
      <svg
        className="sort-button__arrow"
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
  )
}