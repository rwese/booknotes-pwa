import Dexie, { type Table } from 'dexie'
import type { Book, Note, BookCategory, ReadingSession } from '../types'

export class BookNotesDatabase extends Dexie {
  books!: Table<Book>
  notes!: Table<Note>
  categories!: Table<BookCategory>
  readingSessions!: Table<ReadingSession>

  constructor() {
    super('BookNotesDB')

    // Define schema
    this.version(1).stores({
      books: 'id, title, author, isbn, genre, readingStatus, rating, createdAt, updatedAt, *categoryIds, *readingSessionIds',
      notes: 'id, bookId, createdAt',
      categories: 'id, name, *bookIds, parentId',
      readingSessions: 'id, bookId, startDate, endDate'
    })
  }
}

// Singleton instance
export const db = new BookNotesDatabase()

// Database hooks for auto-updating timestamps
db.books.hook('creating', (_primKey, obj) => {
  const now = new Date().toISOString()
  obj.createdAt = now
  obj.updatedAt = now
})

db.books.hook('updating', (modifications) => {
  const now = new Date().toISOString()
  return {
    ...modifications,
    updatedAt: now
  }
})

db.notes.hook('creating', (_primKey, obj) => {
  const now = new Date().toISOString()
  obj.createdAt = now
  obj.updatedAt = now
})

db.notes.hook('updating', (modifications) => {
  const now = new Date().toISOString()
  return {
    ...modifications,
    updatedAt: now
  }
})

db.categories.hook('creating', (_primKey, obj) => {
  const now = new Date().toISOString()
  obj.createdAt = now
  obj.updatedAt = now
})

db.categories.hook('updating', (modifications) => {
  const now = new Date().toISOString()
  return {
    ...modifications,
    updatedAt: now
  }
})

db.readingSessions.hook('creating', (_primKey, obj) => {
  obj.createdAt = new Date().toISOString()
})

// Helper function to convert Blob to Base64 and back
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function base64ToBlob(base64: string): Promise<Blob> {
  return new Promise((resolve) => {
    const byteString = atob(base64.split(',')[1])
    const mimeType = base64.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    const blob = new Blob([ab], { type: mimeType })
    resolve(blob)
  })
}

// Generate UUID
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
