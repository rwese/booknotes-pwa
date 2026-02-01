import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useBook, useCreateBook, useUpdateBook } from '../../hooks/useBooks'
import { isbnService } from '../../services/isbnService'
import { coverImageService } from '../../services/coverImageService'
import type { BookFormData, ReadingStatus } from '../../types'

interface BookFormProps {
  mode: 'create' | 'edit'
}

const readingStatuses: ReadingStatus[] = ['wantToRead', 'currentlyReading', 'read']

export function BookForm({ mode }: BookFormProps) {
  // Use a route pattern that matches both /books/new and /books/$bookId/edit
  const search = useSearch({ from: mode === 'edit' ? '/books/$bookId/edit' : '/books/new' }) as { isbn?: string }
  const params = useParams({ from: mode === 'edit' ? '/books/$bookId/edit' : '/books/new' }) as { bookId?: string }
  const navigate = useNavigate()
  const bookId = mode === 'edit' ? params.bookId : undefined
  const { data: existingBook } = useBook(mode === 'edit' && bookId ? bookId : '')
  const createBook = useCreateBook()
  const updateBook = useUpdateBook()

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

  // Handle ISBN from scanner
  useEffect(() => {
    if (mode === 'create' && typeof search.isbn === 'string' && search.isbn && !formData.title) {
      const isbn = search.isbn
      setFormData(prev => ({ ...prev, isbn }))
      performISBNLookup(isbn)
    }
  }, [mode, search.isbn, formData.title])

  // Populate form with existing book data
  useEffect(() => {
    if (mode === 'edit' && existingBook && !formData.title) {
      setFormData({
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
      })
      if (existingBook.coverImageData) {
        setCroppedCover({
          image: existingBook.coverImageData,
          thumbnail: existingBook.coverThumbnailData || existingBook.coverImageData
        })
      }
    }
  }, [mode, existingBook])

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
    <form onSubmit={handleSubmit} className="book-form">
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
        {mode === 'edit' ? 'Edit Book' : 'Add New Book'}
      </h1>

      {isbnLookupError && (
        <div style={{ padding: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16 }}>
          <p style={{ color: '#dc2626', margin: 0, fontSize: 14 }}>{isbnLookupError}</p>
        </div>
      )}

      {/* Cover Image */}
      <div className="form-group">
        <label className="form-label">Cover Image</label>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {croppedCover ? (
            <img
              src={URL.createObjectURL(croppedCover.thumbnail)}
              alt="Cover"
              style={{ width: 100, height: 150, objectFit: 'cover', borderRadius: 8 }}
            />
          ) : (
            <div style={{ width: 100, height: 150, backgroundColor: 'var(--app-surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--app-border)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
          <div>
            <input type="file" accept="image/*" onChange={handleFileSelect} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: 'var(--app-text)', opacity: 0.6 }}>Upload a cover image</p>
          </div>
        </div>
      </div>

      {/* ISBN Lookup */}
      {mode === 'create' && (
        <div className="form-group">
          <label className="form-label">ISBN Lookup</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={formData.isbn}
              onChange={(e) => updateField('isbn', e.target.value)}
              placeholder="Enter ISBN (10 or 13 digits)"
              className="form-input"
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => formData.isbn && performISBNLookup(formData.isbn)}
              disabled={isLookingUpISBN || !formData.isbn}
            >
              {isLookingUpISBN ? 'Looking up...' : 'Lookup'}
            </button>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="form-input"
          placeholder="Book title"
          required
        />
      </div>

      {/* Author */}
      <div className="form-group">
        <label className="form-label">Author *</label>
        <input
          value={formData.author}
          onChange={(e) => updateField('author', e.target.value)}
          className="form-input"
          placeholder="Author name"
          required
        />
      </div>

      {/* Subtitle */}
      <div className="form-group">
        <label className="form-label">Subtitle</label>
        <input
          value={formData.subtitle}
          onChange={(e) => updateField('subtitle', e.target.value)}
          className="form-input"
          placeholder="Subtitle (optional)"
        />
      </div>

      {/* Genre */}
      <div className="form-group">
        <label className="form-label">Genre</label>
        <input
          value={formData.genre}
          onChange={(e) => updateField('genre', e.target.value)}
          className="form-input"
          placeholder="Genre"
        />
      </div>

      {/* Page Count */}
      <div className="form-group">
        <label className="form-label">Pages</label>
        <input
          type="number"
          value={formData.pageCount || ''}
          onChange={(e) => updateField('pageCount', e.target.value ? parseInt(e.target.value) : undefined)}
          className="form-input"
          placeholder="Number of pages"
        />
      </div>

      {/* Publication Year */}
      <div className="form-group">
        <label className="form-label">Publication Year</label>
        <input
          type="number"
          value={formData.publicationYear || ''}
          onChange={(e) => updateField('publicationYear', e.target.value ? parseInt(e.target.value) : undefined)}
          className="form-input"
          placeholder="Year published"
        />
      </div>

      {/* Publisher */}
      <div className="form-group">
        <label className="form-label">Publisher</label>
        <input
          value={formData.publisher}
          onChange={(e) => updateField('publisher', e.target.value)}
          className="form-input"
          placeholder="Publisher"
        />
      </div>

      {/* Language */}
      <div className="form-group">
        <label className="form-label">Language</label>
        <input
          value={formData.language}
          onChange={(e) => updateField('language', e.target.value)}
          className="form-input"
          placeholder="Language"
        />
      </div>

      {/* Reading Status */}
      <div className="form-group">
        <label className="form-label">Reading Status</label>
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

      {/* Rating */}
      <div className="form-group">
        <label className="form-label">Rating</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => updateField('rating', i + 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <svg
                width="24"
                height="24"
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
      </div>

      {/* Tags */}
      <div className="form-group">
        <label className="form-label">Tags (comma separated)</label>
        <input
          value={formData.tags.join(', ')}
          onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()))}
          className="form-input"
          placeholder="tag1, tag2, tag3"
        />
      </div>

      {/* Custom Notes */}
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          value={formData.customNotes}
          onChange={(e) => updateField('customNotes', e.target.value)}
          className="form-input"
          rows={4}
          placeholder="Personal notes about this book"
        />
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <button type="submit" className="btn btn-primary" disabled={createBook.isPending || updateBook.isPending}>
          {createBook.isPending || updateBook.isPending ? 'Saving...' : 'Save Book'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate({ to: '/books' })}>
          Cancel
        </button>
      </div>
    </form>
  )
}
