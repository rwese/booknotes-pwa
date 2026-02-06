import { useState, useRef, useEffect } from 'react'
import './TagsInput.css'

interface TagsInputProps {
  value: string[]
  onChange: (value: string[]) => void
  suggestions: string[]
  placeholder?: string
}

export function TagsInput({
  value,
  onChange,
  suggestions,
  placeholder = 'Add tags...'
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inputValue && isOpen) {
      const filtered = suggestions.filter(
        (s) =>
          s.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(s)
      )
      setFilteredSuggestions(filtered)
    } else if (isOpen && !inputValue) {
      // Show all suggestions that aren't already selected
      const filtered = suggestions.filter((s) => !value.includes(s))
      setFilteredSuggestions(filtered)
    } else {
      setFilteredSuggestions([])
    }
    setHighlightedIndex(-1)
  }, [inputValue, suggestions, isOpen, value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // If user types a comma, add the tag
    if (newValue.includes(',')) {
      const parts = newValue.split(',')
      const tagToAdd = parts[0].trim()
      if (tagToAdd) {
        addTag(tagToAdd)
      }
      setInputValue(parts.slice(1).join(','))
    } else {
      setInputValue(newValue)
      setIsOpen(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addTag(filteredSuggestions[highlightedIndex])
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
      return
    }

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
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const showSuggestions = isOpen && filteredSuggestions.length > 0

  return (
    <div className="tags-input" ref={containerRef}>
      <div className="tags-input__container" onClick={() => inputRef.current?.focus()}>
        {value.map((tag) => (
          <span key={tag} className="tags-input__tag">
            {tag}
            <button
              type="button"
              className="tags-input__tag-remove"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              aria-label={`Remove ${tag}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="tags-input__input"
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
        />
      </div>
      {showSuggestions && (
        <ul className="autocomplete__list" role="listbox">
          {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
            <li
              key={suggestion}
              className={`autocomplete__item ${index === highlightedIndex ? 'autocomplete__item--highlighted' : ''}`}
              onClick={() => addTag(suggestion)}
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
