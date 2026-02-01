import { useState, useRef, useEffect } from 'react'

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  className?: string
  required?: boolean
}

export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className = '',
  required
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value && isOpen) {
      const filtered = suggestions.filter(
        (s) => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
      )
      setFilteredSuggestions(filtered)
    } else {
      setFilteredSuggestions([])
    }
    setHighlightedIndex(-1)
  }, [value, suggestions, isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setIsOpen(true)
  }

  const handleSelect = (suggestion: string) => {
    onChange(suggestion)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        if (highlightedIndex >= 0) {
          e.preventDefault()
          handleSelect(filteredSuggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const showSuggestions = isOpen && filteredSuggestions.length > 0

  return (
    <div className="autocomplete" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`form-input ${className}`}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-autocomplete="list"
        aria-controls="autocomplete-list"
      />
      {showSuggestions && (
        <ul
          ref={listRef}
          id="autocomplete-list"
          className="autocomplete__list"
          role="listbox"
        >
          {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
            <li
              key={suggestion}
              className={`autocomplete__item ${index === highlightedIndex ? 'autocomplete__item--highlighted' : ''}`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
