import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useBook, useDeleteBook } from '../../hooks/useBooks'
import { noteRepository } from '../../db/repositories/noteRepository'
import type { Note, Book } from '../../types'

export function BookDetail() {
  const { bookId } = useParams({ from: '/books/$bookId' })
  const navigate = useNavigate()
  const { data: book, isLoading, error } = useBook(bookId || '')
  const deleteBook = useDeleteBook()
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'notes'>('overview')

  if (isLoading) {
    return (
      <div className="loading">
        <div className="skeleton" style={{ height: 200, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 40, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 100 }} />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="error-state">
        <p>Error loading book: {error?.message || 'Book not found'}</p>
        <button className="btn btn-secondary" onClick={() => navigate({ to: '/books' })}>
          Back to Books
        </button>
      </div>
    )
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this book?')) {
      await deleteBook.mutateAsync(bookId!)
      navigate({ to: '/books' })
    }
  }

  return (
    <div className="book-detail">
      <div className="detail-header" style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {book.coverThumbnailData || book.coverImageData ? (
          <img
            src={URL.createObjectURL(book.coverThumbnailData || book.coverImageData!)}
            alt={`${book.title} cover`}
            style={{ width: 120, height: 180, objectFit: 'cover', borderRadius: 8 }}
          />
        ) : (
          <div style={{ width: 120, height: 180, backgroundColor: 'var(--app-surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--app-border)' }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px 0' }}>{book.title}</h1>
          <p style={{ color: 'var(--app-text)', margin: '0 0 8px 0' }}>{book.author}</p>
          {book.genre && <span className="status-badge status-want-to-read">{book.genre}</span>}
          {book.readingStatus && (
            <span className={`status-badge status-${book.readingStatus === 'currentlyReading' ? 'reading' : book.readingStatus}`} style={{ marginLeft: 8 }}>
              {book.readingStatus === 'currentlyReading' ? 'Reading' : book.readingStatus === 'wantToRead' ? 'Want to Read' : 'Read'}
            </span>
          )}
          {book.rating && (
            <div className="star-rating" style={{ marginTop: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className={`star ${i < book.rating! ? '' : 'empty'}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="detail-actions" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => navigate({ to: '/books/$bookId/edit', params: { bookId: bookId! } })}>
          Edit
        </button>
        <button className="btn btn-secondary" onClick={handleDelete} disabled={deleteBook.isPending}>
          {deleteBook.isPending ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid var(--app-border)', marginBottom: 16 }}>
        {(['overview', 'details', 'notes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--app-primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--app-primary)' : 'var(--app-text)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && <OverviewTab book={book} />}
        {activeTab === 'details' && <DetailsTab book={book} />}
        {activeTab === 'notes' && <NotesTab bookId={bookId!} />}
      </div>
    </div>
  )
}

function OverviewTab({ book }: { book: Book }) {
  return (
    <div className="overview-tab">
      {book.subtitle && (
        <div className="form-group">
          <label className="form-label">Subtitle</label>
          <p>{book.subtitle}</p>
        </div>
      )}
      {book.tags.length > 0 && (
        <div className="form-group">
          <label className="form-label">Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {book.tags.map((tag) => (
              <span key={tag} className="status-badge status-want-to-read">{tag}</span>
            ))}
          </div>
        </div>
      )}
      {book.customNotes && (
        <div className="form-group">
          <label className="form-label">Notes</label>
          <p style={{ whiteSpace: 'pre-wrap' }}>{book.customNotes}</p>
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
  ]

  return (
    <div className="details-tab">
      {details.filter(d => d.value).map((detail) => (
        <div key={detail.label} className="form-group">
          <label className="form-label">{detail.label}</label>
          <p>{detail.value}</p>
        </div>
      ))}
    </div>
  )
}

function NotesTab({ bookId }: { bookId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadNotes = async () => {
    setIsLoading(true)
    const bookNotes = await noteRepository.getByBookId(bookId)
    setNotes(bookNotes)
    setIsLoading(false)
  }

  useEffect(() => {
    loadNotes()
  }, [bookId])

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    await noteRepository.create({
      bookId,
      text: newNote
    })
    setNewNote('')
    loadNotes()
  }

  const handleDeleteNote = async (noteId: string) => {
    await noteRepository.delete(noteId)
    loadNotes()
  }

  return (
    <div className="notes-tab">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="form-input"
          rows={3}
          style={{ flex: 1 }}
        />
      </div>
      <button className="btn btn-primary" onClick={handleAddNote} disabled={!newNote.trim()}>
        Add Note
      </button>

      {isLoading ? (
        <div style={{ marginTop: 16 }}>Loading notes...</div>
      ) : notes.length === 0 ? (
        <div style={{ marginTop: 16, color: 'var(--app-text)', opacity: 0.6 }}>No notes yet</div>
      ) : (
        <div style={{ marginTop: 16 }}>
          {notes.map((note) => (
            <div key={note.id} style={{ padding: 12, border: '1px solid var(--app-border)', borderRadius: 8, marginBottom: 8 }}>
              <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 8px 0' }}>{note.text}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--app-text)', opacity: 0.6 }}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
                <button onClick={() => handleDeleteNote(note.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
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
