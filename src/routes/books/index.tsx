import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState
} from '@tanstack/react-table'
import { useAllBooks } from '../../hooks/useBooks'
import { useViewPreference } from '../../hooks/useViewPreference'
import { useHashParams } from '../../hooks/useHashParams'
import { ViewToggle } from '../../components/ui/ViewToggle'
import { BookGridCard } from '../../components/books/BookGridCard'
import type { Book } from '../../types'

const columnHelper = createColumnHelper<Book>()

export function BooksIndex() {
  const navigate = useNavigate()
  const { data: books, isLoading, error } = useAllBooks()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [viewMode, setViewMode] = useViewPreference('list')
  const { params, setParams, clearParams } = useHashParams()

  // Extract filter values from hash params
  const statusFilter = params.status || 'all'
  const genreFilter = params.genre || ''
  const tagFilter = params.tag || ''
  const ratingFilter = params.rating ? parseInt(params.rating, 10) : 0

  // Get unique genres and tags from books
  const genres = useMemo(() => {
    if (!books) return []
    const genreSet = new Set<string>()
    books.forEach(book => {
      if (book.genre) genreSet.add(book.genre)
    })
    return Array.from(genreSet).sort()
  }, [books])

  const tags = useMemo(() => {
    if (!books) return []
    const tagSet = new Set<string>()
    books.forEach(book => {
      if (book.tags) {
        book.tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [books])

  const hasActiveFilters = statusFilter !== 'all' || genreFilter || tagFilter || ratingFilter > 0 || globalFilter

  const filteredBooks = useMemo(() => {
    if (!books) return []
    let result = books

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(b => b.readingStatus === statusFilter)
    }

    // Genre filter
    if (genreFilter) {
      result = result.filter(b => b.genre === genreFilter)
    }

    // Tag filter
    if (tagFilter) {
      result = result.filter(b => b.tags?.includes(tagFilter))
    }

    // Rating filter
    if (ratingFilter > 0) {
      result = result.filter(b => b.rating === ratingFilter)
    }

    // Search filter
    if (globalFilter) {
      const search = globalFilter.toLowerCase()
      result = result.filter(b =>
        b.title.toLowerCase().includes(search) ||
        b.author.toLowerCase().includes(search)
      )
    }

    return result
  }, [books, statusFilter, genreFilter, tagFilter, ratingFilter, globalFilter])

  const columns = useMemo(
    () => [
      columnHelper.accessor('coverThumbnailData', {
        header: '',
        cell: ({ row }) => {
          const coverData = row.original.coverThumbnailData || row.original.coverImageData
          if (coverData) {
            const url = URL.createObjectURL(coverData)
            return (
              <img
                src={url}
                alt={`${row.original.title} cover`}
                className="book-cover"
                onLoad={() => URL.revokeObjectURL(url)}
              />
            )
          }
          return <div className="book-cover skeleton" />
        },
        size: 80
      }),
      columnHelper.accessor('title', {
        header: 'Title',
        cell: ({ row }) => <div className="book-title">{row.original.title}</div>
      }),
      columnHelper.accessor('author', {
        header: 'Author',
        cell: ({ row }) => <div className="book-author">{row.original.author}</div>
      }),
      columnHelper.accessor('readingStatus', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.readingStatus
          if (!status) return null
          const statusClass = {
            wantToRead: 'badge badge--status-want',
            currentlyReading: 'badge badge--status-reading',
            read: 'badge badge--status-read'
          }[status]
          const statusLabel = {
            wantToRead: 'Want to Read',
            currentlyReading: 'Reading',
            read: 'Read'
          }[status]
          return <span className={statusClass}>{statusLabel}</span>
        }
      }),
      columnHelper.accessor('rating', {
        header: 'Rating',
        cell: ({ row }) => {
          const rating = row.original.rating
          if (!rating) return null
          return (
            <div className="star-rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className={`star ${i < rating ? '' : 'empty'}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          )
        }
      })
    ],
    []
  )

  const table = useReactTable({
    data: filteredBooks,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  const handleBookClick = (book: Book) => {
    navigate({ to: '/books/$bookId', params: { bookId: book.id } })
  }

  const handleAddBook = () => {
    navigate({ to: '/books/new' })
  }

  if (isLoading) {
    return (
      <div style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 60, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 100, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 100, marginBottom: 8 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error loading books: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="books-page" style={{ padding: 16 }}>
      <div className="page-header">
        <h1 className="page-header__title">Books</h1>
      </div>

      <button className="fab" onClick={handleAddBook} aria-label="Add Book">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search books..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="form-input filter-bar__search"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input filter-bar__select"
        >
          <option value="all">All Status</option>
          <option value="wantToRead">Want to Read</option>
          <option value="currentlyReading">Reading</option>
          <option value="read">Read</option>
        </select>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {books?.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <div className="empty-state-title">No books yet</div>
          <div className="empty-state-description">
            Start adding books to your collection by tapping the Add Book button.
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="book-grid">
          {filteredBooks.map((book) => (
            <BookGridCard
              key={book.id}
              book={book}
              onClick={() => handleBookClick(book)}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} style={{ borderBottom: '1px solid var(--app-border)' }}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: 600,
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' ↑',
                        desc: ' ↓'
                      }[header.column.getIsSorted() as string] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => handleBookClick(row.original)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid var(--app-border)' }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ padding: '12px' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
