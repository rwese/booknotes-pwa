// TypeScript interfaces matching native app models for compatibility

export type ReadingStatus = 'wantToRead' | 'currentlyReading' | 'read'

export interface Book {
  id: string
  slug: string // URL-friendly identifier (e.g., "the-great-gatsby-9780743273565")
  title: string
  author: string
  authorSortName: string
  createdAt: string // ISO date for JSON compat
  updatedAt: string

  // Cover images as Blobs (local) or base64 (export)
  coverImageData?: Blob
  coverThumbnailData?: Blob
  coverBlurredThumbnailData?: Blob

  // Crop metadata for cover adjustment
  coverCropRect?: { x: number; y: number; width: number; height: number }
  coverScale?: number
  coverOffset?: { x: number; y: number }

  // Metadata
  isbn?: string
  isbn10?: string
  isbn13?: string
  publisher?: string
  publicationYear?: number
  genre?: string
  language?: string
  pageCount?: number
  subtitle?: string

  // Status
  readingStatus?: ReadingStatus
  rating?: number // 1-5 stars
  tags: string[]

  // Ownership
  purchaseDate?: string
  purchasePrice?: number
  customNotes?: string

  // Reading progress tracking
  readingStartedAt?: string
  finishedReadingAt?: string
  totalReadingTimeSeconds?: number
  averageReadingTimePerDay?: number
}

export interface Note {
  id: string
  bookId: string
  text: string
  createdAt: string
  updatedAt: string
}

export interface ExportMetadata {
  appVersion: string
  books: ExportBook[]
  coverMapping: Record<string, string>
  totalBooks: number
  booksWithCovers: number
}

export interface ExportBook {
  id: string
  slug?: string
  title: string
  author: string
  isbn?: string
  isbn10?: string
  isbn13?: string
  publisher?: string
  publicationYear?: number
  genre?: string
  language?: string
  pageCount?: number
  subtitle?: string
  readingStatus?: ReadingStatus
  rating?: number
  tags: string[]
  createdAt: string
  updatedAt: string
  coverKey: string | null
  coverFilename: string | null
  // Additional fields for extended export
  customNotes?: string
  purchaseDate?: string
  purchasePrice?: number
  readingStartedAt?: string
  finishedReadingAt?: string
  totalReadingTimeSeconds?: number
  averageReadingTimePerDay?: number
  coverCropRect?: { x: number; y: number; width: number; height: number }
  coverScale?: number
  coverOffset?: { x: number; y: number }
}

// ISBN lookup types
export interface ISBNLookupResult {
  title: string
  authors: string[]
  publisher?: string
  publicationYear?: number
  genre?: string
  language?: string
  pageCount?: number
  description?: string
  isbn10?: string
  isbn13?: string
  coverImageUrl?: string
  coverImageData?: Blob
  coverThumbnailData?: Blob
  subtitle?: string
  categories?: string[]
  source: 'openLibrary' | 'googleBooks'
}

// Form types
export interface BookFormData {
  title: string
  author: string
  isbn?: string
  isbn10?: string
  isbn13?: string
  publisher?: string
  publicationYear?: number
  genre?: string
  language?: string
  pageCount?: number
  subtitle?: string
  readingStatus?: ReadingStatus
  rating?: number
  tags: string[]
  purchaseDate?: string
  purchasePrice?: number
  customNotes?: string
  coverImageData?: Blob
  coverThumbnailData?: Blob
}

// Filter types
export interface BookFilters {
  search?: string
  status?: ReadingStatus | 'all'
  genre?: string
  tags?: string[]
  sortBy?: 'title' | 'author' | 'createdAt' | 'updatedAt' | 'rating'
  sortOrder?: 'asc' | 'desc'
}

// Analytics types
export interface AnalyticsData {
  totalBooks: number
  booksByStatus: Record<ReadingStatus | 'total', number>
  booksByGenre: Record<string, number>
  averageRating: number
  ratingDistribution: Record<number, number>
}
