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
import type { Book } from '../../types'

const columnHelper = createColumnHelper<Book>()

export function BooksIndex() {
  const navigate = useNavigate()
  const { data: books, isLoading, error } = useAllBooks()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredBooks = useMemo(() => {
    if (!books) return []
    if (statusFilter === 'all') return books
    return books.filter(b => b.readingStatus === statusFilter)
  }, [books, statusFilter])

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
            wantToRead: 'status-badge status-want-to-read',
            currentlyReading: 'status-badge status-reading',
            read: 'status-badge status-read'
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Books</h1>
        <button className="btn btn-primary" onClick={handleAddBook}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Book
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search books..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ width: 150 }}
        >
          <option value="all">All Status</option>
          <option value="wantToRead">Want to Read</option>
          <option value="currentlyReading">Reading</option>
          <option value="read">Read</option>
        </select>
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
