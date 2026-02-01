import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useBook, useCreateBook, useUpdateBook, useAuthors, usePublishers, useGenres, useLanguages, useAllTags } from '../../hooks/useBooks'
import { isbnService } from '../../services/isbnService'
import { coverImageService } from '../../services/coverImageService'
import { AutocompleteInput } from '../ui/AutocompleteInput'
import { TagsInput } from '../ui/TagsInput'
import type { BookFormData, ReadingStatus } from '../../types'

interface BookFormProps {
  mode: 'create' | 'edit'
}

const readingStatuses: ReadingStatus[] = ['wantToRead', 'currentlyReading', 'read']

export function BookForm({ mode }: BookFormProps) {
  const search = useSearch({ from: mode === 'edit' ? '/books/$bookId/edit' : '/books/new' }) as { isbn?: string }
  const params = useParams({ from: mode === 'edit' ? '/books/$bookId/edit' : '/books/new' }) as { bookId?: string }
  const navigate = useNavigate()
  const bookId = mode === 'edit' ? params.bookId : undefined
  const { data: existingBook } = useBook(mode === 'edit' && bookId ? bookId : '')
  const createBook = useCreateBook()
  const updateBook = useUpdateBook()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Autocomplete suggestions
  const { data: authorSuggestions = [] } = useAuthors()
  const { data: publisherSuggestions = [] } = usePublishers()
  const { data: genreSuggestions = [] } = useGenres()
  const { data: languageSuggestions = [] } = useLanguages()
  const { data: tagSuggestions = [] } = useAllTags()

  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    isbn: '',
    isbn10: '',
    isbn13: '',
    publisher: '',
    publicationYear: undefined,
    genre: '',
    language: '',
    pageCount: undefined,
    subtitle: '',
    readingStatus: undefined,
    rating: undefined,
    tags: [],
    categoryIds: [],
    purchaseDate: '',
    purchasePrice: undefined,
    customNotes: ''
  })

  const [croppedCover, setCroppedCover] = useState<{ image: Blob; thumbnail: Blob } | null>(null)
  const [isLookingUpISBN, setIsLookingUpISBN] = useState(false)
  const [isbnLookupError, setIsbnLookupError] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [initialFormData, setInitialFormData] = useState<BookFormData | null>(null)
  const [initialCover, setInitialCover] = useState<{ image: Blob; thumbnail: Blob } | null>(null)

  const hasUnsavedChanges = (() => {
    if (!initialFormData) return formData.title !== '' || formData.author !== ''

    const dataChanged =
      formData.title !== initialFormData.title ||
      formData.author !== initialFormData.author ||
      formData.subtitle !== initialFormData.subtitle ||
      formData.publisher !== initialFormData.publisher ||
      formData.publicationYear !== initialFormData.publicationYear ||
      formData.pageCount !== initialFormData.pageCount ||
      formData.genre !== initialFormData.genre ||
      formData.language !== initialFormData.language ||
      formData.readingStatus !== initialFormData.readingStatus ||
      formData.rating !== initialFormData.rating ||
      formData.tags.join(',') !== initialFormData.tags.join(',') ||
      formData.customNotes !== initialFormData.customNotes

    const coverChanged = !!(croppedCover && !initialCover)

    return dataChanged || coverChanged
  })()

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        navigate({ to: '/books' })
      }
    } else {
      navigate({ to: '/books' })
    }
  }

  useEffect(() => {
    if (croppedCover) {
      const url = URL.createObjectURL(croppedCover.thumbnail)
      setCoverUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    return undefined
  }, [croppedCover])

  const [isbnProcessed, setIsbnProcessed] = useState(false)
  useEffect(() => {
    if (mode === 'create' && typeof search.isbn === 'string' && search.isbn && !isbnProcessed) {
      const isbn = search.isbn
      setIsbnProcessed(true)
      setFormData(prev => ({ ...prev, isbn }))
      performISBNLookup(isbn)
    }
  }, [mode, search.isbn, isbnProcessed])

  const [formInitialized, setFormInitialized] = useState(false)
  useEffect(() => {
    if (mode === 'edit' && existingBook && !formInitialized) {
      setFormInitialized(true)
      const initialData = {
        title: existingBook.title,
        author: existingBook.author,
        isbn: existingBook.isbn || '',
        isbn10: existingBook.isbn10 || '',
        isbn13: existingBook.isbn13 || '',
        publisher: existingBook.publisher || '',
        publicationYear: existingBook.publicationYear,
        genre: existingBook.genre || '',
        language: existingBook.language || '',
        pageCount: existingBook.pageCount,
        subtitle: existingBook.subtitle || '',
        readingStatus: existingBook.readingStatus,
        rating: existingBook.rating,
        tags: existingBook.tags,
        categoryIds: existingBook.categoryIds,
        purchaseDate: existingBook.purchaseDate || '',
        purchasePrice: existingBook.purchasePrice,
        customNotes: existingBook.customNotes || ''
      }
      setFormData(initialData)
      setInitialFormData(initialData)
      if (existingBook.coverImageData) {
        const coverData = {
          image: existingBook.coverImageData,
          thumbnail: existingBook.coverThumbnailData || existingBook.coverImageData
        }
        setCroppedCover(coverData)
        setInitialCover(coverData)
      }
    }
  }, [mode, existingBook, formInitialized])

  const updateField = <K extends keyof BookFormData>(field: K, value: BookFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const performISBNLookup = async (isbn: string) => {
    setIsLookingUpISBN(true)
    setIsbnLookupError(null)
    try {
      const result = await isbnService.lookup(isbn)
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        author: result.authors?.join(', ') || prev.author,
        publisher: result.publisher || prev.publisher,
        publicationYear: result.publicationYear || prev.publicationYear,
        genre: result.genre || prev.genre,
        language: result.language || prev.language,
        pageCount: result.pageCount || prev.pageCount,
        subtitle: result.subtitle || prev.subtitle,
        isbn10: result.isbn10 || prev.isbn10,
        isbn13: result.isbn13 || prev.isbn13
      }))

      if (result.coverImageData) {
        setCroppedCover({
          image: result.coverImageData,
          thumbnail: result.coverThumbnailData || result.coverImageData
        })
      }
    } catch {
      setIsbnLookupError('Book not found for this ISBN. Please enter details manually.')
    } finally {
      setIsLookingUpISBN(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const processed = await coverImageService.processImage(file)
    setCroppedCover({ image: processed.fullImage, thumbnail: processed.thumbnail })
  }

  const handleCoverClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const bookData = {
      ...formData,
      authorSortName: formData.author,
      coverImageData: croppedCover?.image || (mode === 'edit' ? existingBook?.coverImageData : undefined),
      coverThumbnailData: croppedCover?.thumbnail || (mode === 'edit' ? existingBook?.coverThumbnailData : undefined),
      tags: formData.tags.filter(Boolean),
      categoryIds: formData.categoryIds.filter(Boolean),
      readingSessionIds: [] as string[]
    }

    try {
      if (mode === 'edit' && bookId) {
        await updateBook.mutateAsync({ id: bookId, updates: bookData })
        navigate({ to: '/books/$bookId', params: { bookId } })
      } else {
        const newBookId = await createBook.mutateAsync(bookData)
        navigate({ to: '/books/$bookId', params: { bookId: newBookId } })
      }
    } catch (error) {
      console.error('Failed to save book:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="book-form" style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
        {mode === 'edit' ? 'Edit Book' : 'Add New Book'}
      </h1>

      {isbnLookupError && (
        <div className="form__error">
          <p className="form__error-text">{isbnLookupError}</p>
        </div>
      )}

      {/* Cover & Identity Section */}
      <div className="form__section">
        <div className="form__section-header">
          <svg className="form__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <h2 className="form__section-title">Book Information</h2>
        </div>

        <div className="form__cover-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Cover"
              className="form__cover-preview"
              onClick={handleCoverClick}
              style={{ cursor: 'pointer' }}
            />
          ) : (
            <div className="form__cover-upload" onClick={handleCoverClick}>
              <svg className="form__cover-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="form__cover-upload-text">Click to upload cover</span>
            </div>
          )}
        </div>

        <div className="form__cover-actions">
          {mode === 'create' && (
            <div className="form__group">
              <label className="form__label">ISBN Lookup</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={formData.isbn}
                  onChange={(e) => updateField('isbn', e.target.value)}
                  placeholder="Enter ISBN"
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => formData.isbn && performISBNLookup(formData.isbn)}
                  disabled={isLookingUpISBN || !formData.isbn}
                >
                  {isLookingUpISBN ? 'Looking...' : 'Lookup'}
                </button>
              </div>
              <p className="form__hint">Enter ISBN to auto-fill book details</p>
            </div>
          )}

          <div className="form__group">
            <label className="form__label">Title *</label>
            <input
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="form-input"
              placeholder="Book title"
              required
            />
          </div>

          <div className="form__group">
            <label className="form__label">Author *</label>
            <AutocompleteInput
              value={formData.author}
              onChange={(value) => updateField('author', value)}
              suggestions={authorSuggestions}
              placeholder="Author name"
              required
            />
          </div>

          <div className="form__group">
            <label className="form__label">Subtitle</label>
            <input
              value={formData.subtitle}
              onChange={(e) => updateField('subtitle', e.target.value)}
              className="form-input"
              placeholder="Subtitle (optional)"
            />
          </div>
        </div>
      </div>

      {/* Publication Details Section */}
      <div className="form__section">
        <div className="form__section-header">
          <svg className="form__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2 className="form__section-title">Publication Details</h2>
        </div>

        <div className="form__row">
          <div className="form__group">
            <label className="form__label">Publisher</label>
            <AutocompleteInput
              value={formData.publisher || ''}
              onChange={(value) => updateField('publisher', value)}
              suggestions={publisherSuggestions}
              placeholder="Publisher"
            />
          </div>

          <div className="form__group">
            <label className="form__label">Year</label>
            <input
              type="number"
              value={formData.publicationYear || ''}
              onChange={(e) => updateField('publicationYear', e.target.value ? parseInt(e.target.value) : undefined)}
              className="form-input"
              placeholder="Year"
            />
          </div>
        </div>

        <div className="form__row">
          <div className="form__group">
            <label className="form__label">Pages</label>
            <input
              type="number"
              value={formData.pageCount || ''}
              onChange={(e) => updateField('pageCount', e.target.value ? parseInt(e.target.value) : undefined)}
              className="form-input"
              placeholder="Pages"
            />
          </div>

          <div className="form__group">
            <label className="form__label">Genre</label>
            <AutocompleteInput
              value={formData.genre || ''}
              onChange={(value) => updateField('genre', value)}
              suggestions={genreSuggestions}
              placeholder="Genre"
            />
          </div>

          <div className="form__group">
            <label className="form__label">Language</label>
            <AutocompleteInput
              value={formData.language || ''}
              onChange={(value) => updateField('language', value)}
              suggestions={languageSuggestions}
              placeholder="Language"
            />
          </div>
        </div>
      </div>

      {/* Reading Status Section */}
      <div className="form__section">
        <div className="form__section-header">
          <svg className="form__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <h2 className="form__section-title">Reading Status</h2>
        </div>

        <div className="form__row">
          <div className="form__group">
            <label className="form__label">Status</label>
            <select
              value={formData.readingStatus || ''}
              onChange={(e) => updateField('readingStatus', e.target.value as ReadingStatus || undefined)}
              className="form-input"
            >
              <option value="">Select status</option>
              {readingStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'wantToRead' ? 'Want to Read' : status === 'currentlyReading' ? 'Currently Reading' : 'Read'}
                </option>
              ))}
            </select>
          </div>

          <div className="form__group">
            <label className="form__label">Rating</label>
            <div style={{ display: 'flex', gap: 4, paddingTop: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateField('rating', formData.rating === i + 1 ? undefined : i + 1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill={i < (formData.rating || 0) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: i < (formData.rating || 0) ? '#fbbf24' : 'var(--app-border)' }}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="form__hint">Click a star to set rating, click again to clear</p>
          </div>
        </div>
      </div>

      {/* Organization Section */}
      <div className="form__section">
        <div className="form__section-header">
          <svg className="form__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          <h2 className="form__section-title">Organization</h2>
        </div>

        <div className="form__group">
          <label className="form__label">Tags</label>
          <TagsInput
            value={formData.tags}
            onChange={(tags) => updateField('tags', tags)}
            suggestions={tagSuggestions}
            placeholder="Add tags..."
          />
          <p className="form__hint">Type and press Enter or comma to add tags</p>
        </div>

        <div className="form__group">
          <label className="form__label">Notes</label>
          <textarea
            value={formData.customNotes}
            onChange={(e) => updateField('customNotes', e.target.value)}
            className="form-input"
            rows={4}
            placeholder="Personal notes about this book..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="form__actions">
        <button type="button" className="btn btn-secondary" onClick={handleGoBack}>
          Cancel
        </button>
      </div>

      <button className="fab fab--back" onClick={handleGoBack} aria-label="Go Back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button className="fab" type="submit" disabled={createBook.isPending || updateBook.isPending} aria-label="Save Book">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      </button>
    </form>
  )
}
