import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState
} from '@tanstack/react-table'
import type { Book } from '../../types'
import './BookList.css'

const columnHelper = createColumnHelper<Book>()

interface BookListProps {
  books: Book[]
  onBookClick: (book: Book) => void
}

export function BookList({ books, onBookClick }: BookListProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

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
        cell: ({ row }) => (
          <div className="book-title">{row.original.title}</div>
        )
      }),
      columnHelper.accessor('author', {
        header: 'Author',
        cell: ({ row }) => (
          <div className="book-author">{row.original.author}</div>
        )
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
                <svg
                  key={i}
                  className={`star ${i < rating ? '' : 'empty'}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
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
    data: books,
    columns,
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  if (books.length === 0) {
    return (
      <div className="empty-state">
        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <div className="empty-state-title">No books yet</div>
        <div className="empty-state-description">
          Start adding books to your collection by tapping the + button below.
        </div>
      </div>
    )
  }

  return (
    <div className="book-list">
      <div className="search-bar mb-4">
        <input
          type="text"
          placeholder="Search books..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="book-table w-full border-collapse">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-[var(--app-border)]">
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                className="p-3 text-left font-semibold cursor-pointer select-none"
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
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onBookClick(row.original)}
              className="book-card cursor-pointer"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </div>
    </div>
  )
}
