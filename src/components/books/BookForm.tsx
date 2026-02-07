import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { navigateWithBasepath } from '../../utils/navigation'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { useBookBySlug, useCreateBook, useUpdateBook, useDeleteBook, useAuthors, usePublishers, useGenres, useLanguages, useAllTags } from '../../hooks/useBooks'
import { isbnService } from '../../services/isbnService'
import { coverImageService } from '../../services/coverImageService'
import { bookRepository } from '../../db/repositories/bookRepository'
import { isUUID } from '../../utils/slug'
import { AutocompleteInput } from '../ui/AutocompleteInput'
import { TagsInput } from '../ui/TagsInput'
import type { BookFormData, ReadingStatus } from '../../types'
import './BookForm.css'

interface BookFormProps {
  mode: 'create' | 'edit'
}

const readingStatuses: ReadingStatus[] = ['wantToRead', 'currentlyReading', 'read']

export function BookForm({ mode }: BookFormProps) {
  const [searchParams] = useSearchParams()
  const { bookSlug } = useParams()
  const navigate = useNavigate()
  const isbn = searchParams.get('isbn') || undefined

  // Resolve book ID from slug (handles both UUID legacy URLs and new slug URLs)
  const [resolvedBookId, setResolvedBookId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const resolveBook = async () => {
      if (!bookSlug || mode !== 'edit') return

      if (isUUID(bookSlug)) {
        // Legacy UUID URL
        const book = await bookRepository.getById(bookSlug)
        if (book && mounted) {
          setResolvedBookId(book.id)
        }
      } else {
        // Slug URL - look up by slug
        const book = await bookRepository.getBySlug(bookSlug)
        if (book && mounted) {
          setResolvedBookId(book.id)
        }
      }
    }

    resolveBook()

    return () => { mounted = false }
  }, [bookSlug, mode])

  const bookId = resolvedBookId || undefined
  const { data: existingBook } = useBookBySlug(bookSlug || '')
  const createBook = useCreateBook()
  const updateBook = useUpdateBook()
  const deleteBook = useDeleteBook()
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
    purchaseDate: '',
    purchasePrice: undefined,
    customNotes: '',
    coverImageData: undefined,
    coverThumbnailData: undefined
  })

  const [isLookingUpISBN, setIsLookingUpISBN] = useState(false)
  const [isbnLookupError, setIsbnLookupError] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [initialFormData, setInitialFormData] = useState<BookFormData | null>(null)

  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [cropArea, setCropArea] = useState<Area | null>(null)
  const [isProcessingCrop, setIsProcessingCrop] = useState(false)

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
      formData.customNotes !== initialFormData.customNotes ||
      formData.coverImageData !== initialFormData.coverImageData

    return dataChanged
  })()

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        if (mode === 'edit' && existingBook) {
          navigateWithBasepath(navigate, `/books/${existingBook.slug}`)
        } else {
          navigateWithBasepath(navigate, '/books')
        }
      }
    } else {
      if (mode === 'edit' && existingBook) {
        navigateWithBasepath(navigate, `/books/${existingBook.slug}`)
      } else {
        navigateWithBasepath(navigate, '/books')
      }
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this book?')) {
      if (bookId) {
        await deleteBook.mutateAsync(bookId)
        navigateWithBasepath(navigate, '/books')
      }
    }
  }

  useEffect(() => {
    const blob = formData.coverThumbnailData || formData.coverImageData
    if (blob) {
      const url = URL.createObjectURL(blob)
      setCoverUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setCoverUrl(null)
    return undefined
  }, [formData.coverThumbnailData, formData.coverImageData])

  const [isbnProcessed, setIsbnProcessed] = useState(false)
  useEffect(() => {
    if (mode === 'create' && isbn && !isbnProcessed) {
      setIsbnProcessed(true)
      setFormData(prev => ({ ...prev, isbn }))
      performISBNLookup(isbn)
    }
  }, [mode, isbn, isbnProcessed])

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
        purchaseDate: existingBook.purchaseDate || '',
        purchasePrice: existingBook.purchasePrice,
        customNotes: existingBook.customNotes || '',
        coverImageData: existingBook.coverImageData,
        coverThumbnailData: existingBook.coverThumbnailData
      }
      setFormData(initialData)
      setInitialFormData(initialData)
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
        updateField('coverImageData', result.coverImageData)
        updateField('coverThumbnailData', result.coverThumbnailData || result.coverImageData)
      }
    } catch {
      setIsbnLookupError('Book not found for this ISBN. Please enter details manually.')
    } finally {
      setIsLookingUpISBN(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Read file and show crop modal
    const reader = new FileReader()
    reader.onload = (event) => {
      setCrop({ x: 0, y: 0 })
      setCropArea(null)
      setCropImageSrc(event.target?.result as string)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCoverClick = () => {
    fileInputRef.current?.click()
  }

  const onCropChange = useCallback((newCrop: { x: number; y: number }) => {
    setCrop(newCrop)
  }, [])

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCropArea(croppedAreaPixels)
  }, [])

  const handleCropDone = async () => {
    if (!cropImageSrc || !cropArea) return

    // Validate crop area has valid dimensions
    if (cropArea.width <= 0 || cropArea.height <= 0) {
      console.error('Invalid crop area dimensions')
      handleCropCancel()
      return
    }

    setIsProcessingCrop(true)
    try {
      // Create a File from the image src
      const response = await fetch(cropImageSrc)
      const blob = await response.blob()
      const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })

      // Get image dimensions to convert pixels to percentages
      const img = new Image()
      img.src = cropImageSrc
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
      })

      // Convert pixels to percentages for the service
      const cropRect = {
        x: cropArea.x / img.width,
        y: cropArea.y / img.height,
        width: cropArea.width / img.width,
        height: cropArea.height / img.height
      }

      // Process with crop coordinates
      const processed = await coverImageService.processImage(file, cropRect)

      updateField('coverImageData', processed.fullImage)
      updateField('coverThumbnailData', processed.thumbnail)
      setShowCropModal(false)
      setCropImageSrc(null)
      setCropArea(null)
    } catch (error) {
      console.error('Failed to crop image:', error)
    } finally {
      setIsProcessingCrop(false)
    }
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setCropImageSrc(null)
    setCropArea(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const bookData = {
      ...formData,
      authorSortName: formData.author,
      tags: formData.tags.filter(Boolean),
      readingSessionIds: [] as string[]
    }

    try {
      if (mode === 'edit' && bookId) {
        await updateBook.mutateAsync({ id: bookId, updates: bookData })

        // Update slug if title or ISBN changed
        const titleChanged = existingBook && formData.title !== existingBook.title
        const isbnChanged = existingBook && formData.isbn !== existingBook.isbn
        if (titleChanged || isbnChanged) {
          await bookRepository.updateSlug(bookId, formData.title, formData.isbn)
        }

        // Force refetch the book data to ensure fresh Blob references
        const freshBook = await bookRepository.getById(bookId)
        if (freshBook) {
          navigateWithBasepath(navigate, `/books/${freshBook.slug}`)
        } else {
          navigateWithBasepath(navigate, '/books')
        }
      } else {
        const newBookId = await createBook.mutateAsync(bookData)
        // Get the created book to get its slug
        const newBook = await bookRepository.getById(newBookId)
        if (newBook) {
          navigateWithBasepath(navigate, `/books/${newBook.slug}`)
        } else {
          navigateWithBasepath(navigate, '/books')
        }
      }
    } catch (error) {
      console.error('Failed to save book:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="book-form">
      <h1 className="text-xl font-semibold mb-6">
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
            <>
              <div
                className="form__cover-preview"
                onClick={handleCoverClick}
                onKeyDown={(e) => e.key === 'Enter' && handleCoverClick()}
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
              >
                <img src={coverUrl} alt="Book cover" />
              </div>
              {mode === 'edit' && (
                <button
                type="button"
                className="btn btn-secondary mt-2"
                onClick={() => {
                  updateField('coverImageData', undefined)
                  updateField('coverThumbnailData', undefined)
                }}
              >
                  Remove Cover
                </button>
              )}
            </>
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
              <div className="flex gap-2">
                <input
                  value={formData.isbn}
                  onChange={(e) => updateField('isbn', e.target.value)}
                  placeholder="Enter ISBN"
                  className="form-input flex-1"
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
            <div
              className="status-buttons"
              role="group"
              aria-label="Reading status"
            >
              {readingStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`status-buttons__btn ${formData.readingStatus === status ? 'status-buttons__btn--active' : ''}`}
                  onClick={() => updateField('readingStatus', formData.readingStatus === status ? undefined : status)}
                  aria-pressed={formData.readingStatus === status}
                >
                  {status === 'wantToRead' ? 'Want to Read' : status === 'currentlyReading' ? 'Currently Reading' : 'Read'}
                </button>
              ))}
            </div>
          </div>

          <div className="form__group">
            <div className="flex gap-1 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateField('rating', formData.rating === i + 1 ? undefined : i + 1)}
                  className="p-1 cursor-pointer"
                  aria-label={`Rate ${i + 1} stars`}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill={i < (formData.rating || 0) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    className={i < (formData.rating || 0) ? 'text-amber-400' : 'text-border'}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
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

      <button className="fab fab--back" onClick={handleGoBack} type="button" aria-label="Go Back">
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

      {mode === 'edit' && (
        <button
          className="fab fab--mini fab--danger"
          onClick={handleDelete}
          disabled={deleteBook.isPending}
          type="button"
          aria-label="Delete Book"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      )}

      {/* Cover Crop Modal */}
      {showCropModal && cropImageSrc && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-container">
            <div className="crop-modal-cropper">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                onCropChange={onCropChange}
                cropShape="rect"
                aspect={2 / 3}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="crop-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCropCancel}
                disabled={isProcessingCrop}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCropDone}
                disabled={isProcessingCrop}
              >
                {isProcessingCrop ? 'Processing...' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
