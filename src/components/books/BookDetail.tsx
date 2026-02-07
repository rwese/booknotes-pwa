import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useBookBySlug } from '../../hooks/useBooks'
import { noteRepository } from '../../db/repositories/noteRepository'
import { bookRepository } from '../../db/repositories/bookRepository'
import { isUUID } from '../../utils/slug'
import type { Note, Book } from '../../types'
import './BookDetail.css'

export function BookDetail() {
  const params = useParams({ from: '/books/$bookSlug' })
  const { bookSlug } = params
  const navigate = useNavigate()

  // Check if the parameter is a UUID (legacy URL) or a slug
  const [bookId, setBookId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const resolveBook = async () => {
      if (!bookSlug) return

      if (isUUID(bookSlug)) {
        // Legacy UUID URL - look up by ID and redirect to slug URL
        const book = await bookRepository.getById(bookSlug)
        if (book && mounted) {
          setBookId(book.id)
          // Redirect to slug URL
          navigate({ to: '/books/$bookSlug', params: { bookSlug: book.slug }, replace: true })
        }
      } else {
        // Slug URL - look up by slug
        const book = await bookRepository.getBySlug(bookSlug)
        if (book && mounted) {
          setBookId(book.id)
        }
      }
    }

    resolveBook()

    return () => { mounted = false }
  }, [bookSlug, navigate])

  const { data: book, isLoading, error } = useBookBySlug(bookSlug || '')
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'notes'>('overview')

  // If we resolved a legacy UUID, use that ID for operations
  const effectiveBookId = bookId || (book ? book.id : undefined)

  // Use ref to track cover URL and only create/revoke when necessary
  const coverUrlRef = useRef<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)

  // Create blob URL from cover data, only when data actually changes
  useEffect(() => {
    const coverData = book?.coverThumbnailData || book?.coverImageData
    
    if (!coverData) {
      // No cover data - revoke existing URL if any
      if (coverUrlRef.current) {
        URL.revokeObjectURL(coverUrlRef.current)
        coverUrlRef.current = null
      }
      setCoverUrl(null)
      return
    }

    // Create new blob URL
    const newUrl = URL.createObjectURL(coverData)
    
    // Revoke old URL after a delay to allow image to load with new URL
    const oldUrl = coverUrlRef.current
    coverUrlRef.current = newUrl
    setCoverUrl(newUrl)

    // Cleanup: revoke the old URL after giving time for the new one to be used
    if (oldUrl) {
      const timeoutId = setTimeout(() => {
        URL.revokeObjectURL(oldUrl)
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [book?.coverThumbnailData, book?.coverImageData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (coverUrlRef.current) {
        URL.revokeObjectURL(coverUrlRef.current)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="book-detail">
        <div className="book-detail__hero">
          <div className="skeleton w-[150px] h-[225px] rounded-lg" />
          <div className="flex-1">
            <div className="skeleton h-8 mb-3 w-4/5" />
            <div className="skeleton h-5 mb-2 w-1/2" />
            <div className="skeleton h-6 w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="book-detail">
        <div className="empty-state">
          <p style={{ marginBottom: 16 }}>Error loading book: {error?.message || 'Book not found'}</p>
          <button className="btn btn--secondary" onClick={() => navigate({ to: '/books' })}>
            Back to Books
          </button>
        </div>
      </div>
    )
  }

  const statusLabel: Record<string, string> = {
    wantToRead: 'Want to Read',
    currentlyReading: 'Currently Reading',
    read: 'Read'
  }

  const statusClass: Record<string, string> = {
    wantToRead: 'badge badge--status-want',
    currentlyReading: 'badge badge--status-reading',
    read: 'badge badge--status-read'
  }

  return (
    <div className="book-detail">
      <div className="book-detail__hero">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${book.title} cover`}
            className="book-detail__cover"
          />
        ) : (
          <div className="book-detail__cover-placeholder">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-border">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
        )}
        <div className="book-detail__info">
          <h1 className="book-detail__title">{book.title}</h1>
          <p className="book-detail__author">{book.author}</p>
          <div className="book-detail__badges">
            {book.genre && <span className="badge badge--tag">{book.genre}</span>}
            {book.readingStatus && (
              <span className={statusClass[book.readingStatus]}>
                {statusLabel[book.readingStatus]}
              </span>
            )}
          </div>
          {book.rating && (
            <div className="book-detail__rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className={`star ${i < book.rating! ? '' : 'empty'}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="book-detail__actions">
      </div>

      <button className="fab fab--back" onClick={() => navigate({ to: '/books' })} aria-label="Back to Books">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button className="fab" onClick={() => navigate({ to: '/books/$bookSlug/edit', params: { bookSlug: book.slug } })} aria-label="Edit Book">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>

      <div className="book-detail__tabs">
        {(['overview', 'details', 'notes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`book-detail__tab ${activeTab === tab ? 'book-detail__tab--active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="book-detail__content">
        {activeTab === 'overview' && <OverviewTab book={book} />}
        {activeTab === 'details' && <DetailsTab book={book} />}
        {activeTab === 'notes' && <NotesTab bookId={effectiveBookId!} />}
      </div>
    </div>
  )
}

function OverviewTab({ book }: { book: Book }) {
  return (
    <div className="overview-tab">
      {book.subtitle && (
        <div className="details-grid__item mb-4">
          <div className="details-grid__label">Subtitle</div>
          <div className="details-grid__value">{book.subtitle}</div>
        </div>
      )}
      {book.tags.length > 0 && (
        <div className="mb-4">
          <div className="details-grid__label mb-2">Tags</div>
          <div className="flex flex-wrap gap-2">
            {book.tags.map((tag) => (
              <span key={tag} className="badge badge--tag">{tag}</span>
            ))}
          </div>
        </div>
      )}
      {book.customNotes && (
        <div className="note-card">
          <div className="details-grid__label mb-2">Notes</div>
          <p className="note-card__text m-0">{book.customNotes}</p>
        </div>
      )}
      {!book.subtitle && book.tags.length === 0 && !book.customNotes && (
        <div className="text-[#64748b] text-center py-6">
          No overview information available. Add some tags or notes!
        </div>
      )}
    </div>
  )
}

function DetailsTab({ book }: { book: Book }) {
  const details = [
    { label: 'ISBN', value: book.isbn },
    { label: 'ISBN-10', value: book.isbn10 },
    { label: 'ISBN-13', value: book.isbn13 },
    { label: 'Publisher', value: book.publisher },
    { label: 'Publication Year', value: book.publicationYear?.toString() },
    { label: 'Pages', value: book.pageCount?.toString() },
    { label: 'Language', value: book.language },
    { label: 'Added', value: new Date(book.createdAt).toLocaleDateString() },
    { label: 'Updated', value: new Date(book.updatedAt).toLocaleDateString() },
  ].filter(d => d.value)

  if (details.length === 0) {
    return (
      <div className="text-[#64748b] text-center py-6">
        No details available. Edit the book to add more information.
      </div>
    )
  }

  return (
    <div className="details-grid">
      {details.map((detail) => (
        <div key={detail.label} className="details-grid__item">
          <div className="details-grid__label">{detail.label}</div>
          <div className="details-grid__value">{detail.value}</div>
        </div>
      ))}
    </div>
  )
}

function NotesTab({ bookId }: { bookId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadNotes = async () => {
      setIsLoading(true)
      const bookNotes = await noteRepository.getByBookId(bookId)
      if (mounted) {
        setNotes(bookNotes)
        setIsLoading(false)
      }
    }
    loadNotes()
    return () => { mounted = false }
  }, [bookId])

  const refreshNotes = async () => {
    const bookNotes = await noteRepository.getByBookId(bookId)
    setNotes(bookNotes)
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    await noteRepository.create({
      bookId,
      text: newNote
    })
    setNewNote('')
    refreshNotes()
  }

  const handleDeleteNote = async (noteId: string) => {
    await noteRepository.delete(noteId)
    refreshNotes()
  }

  return (
    <div className="notes-tab">
      <div className="mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="form-input w-full mb-2"
          rows={3}
        />
        <button className="btn btn-primary" onClick={handleAddNote} disabled={!newNote.trim()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Note
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <div className="skeleton h-20 rounded-lg" />
          <div className="skeleton h-20 rounded-lg" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-[#64748b] text-center py-6">
          No notes yet. Add your first note above!
        </div>
      ) : (
        <div>
          {notes.map((note) => (
            <div key={note.id} className="note-card">
              <p className="note-card__text">{note.text}</p>
              <div className="note-card__footer">
                <span className="note-card__date">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
                <button onClick={() => handleDeleteNote(note.id)} className="note-card__delete">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
