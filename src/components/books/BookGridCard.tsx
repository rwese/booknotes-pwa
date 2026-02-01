import { useMemo, useEffect } from 'react'
import type { Book } from '../../types'

interface BookGridCardProps {
  book: Book
  onClick: () => void
}

export function BookGridCard({ book, onClick }: BookGridCardProps) {
  const coverData = book.coverThumbnailData || book.coverImageData
  const coverUrl = useMemo(() => {
    return coverData ? URL.createObjectURL(coverData) : null
  }, [coverData])

  useEffect(() => {
    return () => {
      if (coverUrl) URL.revokeObjectURL(coverUrl)
    }
  }, [coverUrl])

  const statusLabel: Record<string, string> = {
    wantToRead: 'Want',
    currentlyReading: 'Reading',
    read: 'Read'
  }

  const statusClass: Record<string, string> = {
    wantToRead: 'badge badge--status-want',
    currentlyReading: 'badge badge--status-reading',
    read: 'badge badge--status-read'
  }

  return (
    <div className="book-card--grid" onClick={onClick}>
      <div className="book-card__cover-container">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${book.title} cover`}
            className="book-card__cover"
          />
        ) : (
          <div className="book-card__cover-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="book-card__body">
        <h3 className="book-card__title">{book.title}</h3>
        <p className="book-card__author">{book.author}</p>
        <div className="book-card__meta">
          {book.rating ? (
            <div className="book-card__rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`star ${i < book.rating! ? '' : 'empty'}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          ) : (
            <span />
          )}
          {book.readingStatus && (
            <span className={statusClass[book.readingStatus]}>
              {statusLabel[book.readingStatus]}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
