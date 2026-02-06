interface FilterToggleProps {
  isOpen: boolean
  onToggle: () => void
  activeCount: number
}

import './FilterToggle.css'

export function FilterToggle({ isOpen, onToggle, activeCount }: FilterToggleProps) {
  return (
    <button
      className={`filter-toggle ${isOpen ? 'filter-toggle--active' : ''}`}
      onClick={onToggle}
      aria-label="Toggle filters"
      title="Toggle filters"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
      {activeCount > 0 && (
        <span className="filter-toggle__badge">{activeCount}</span>
      )}
    </button>
  )
}
