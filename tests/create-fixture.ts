/**
 * Test fixture generation script
 * Run: npx tsx tests/create-fixture.ts
 *
 * Creates a minimal valid import fixture for testing import functionality
 */

import JSZip from 'jszip'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function createFixture() {
  const zip = new JSZip()

  // Create minimal metadata for native format export
  const metadata = {
    appVersion: '1.0',
    books: [
      {
        id: 'test-book-1',
        slug: 'test-book-1',
        title: 'Test Book One',
        author: 'Test Author One',
        isbn: '9780544003415',
        isbn10: '0544003415',
        isbn13: '9780544003415',
        genre: 'Fiction',
        language: 'English',
        pageCount: 250,
        readingStatus: 'Want to Read',
        rating: 4,
        tags: ['test', 'fixture'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        coverKey: 'test-book-1',
        coverFilename: 'test-book-1_cover.jpg'
      },
      {
        id: 'test-book-2',
        slug: 'test-book-2',
        title: 'Test Book Two',
        author: 'Test Author Two',
        isbn: '9780451524935',
        isbn10: '0451524938',
        isbn13: '9780451524935',
        genre: 'Classic',
        language: 'English',
        pageCount: 320,
        readingStatus: 'Read',
        rating: 5,
        tags: ['test'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        coverKey: null,
        coverFilename: null
      }
    ],
    coverMapping: {},
    totalBooks: 2,
    booksWithCovers: 0
  }

  zip.file('metadata.json', JSON.stringify(metadata, null, 2))

  // Add notes
  const notes = [
    {
      id: 'note-1',
      bookId: 'test-book-1',
      content: 'This is a test note for book one',
      pageNumber: 10,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ]
  zip.file('notes.json', JSON.stringify(notes, null, 2))

  // Generate ZIP
  const content = await zip.generateAsync({ type: 'nodebuffer' })

  // Write to fixtures directory
  const fixturePath = join(process.cwd(), 'tests', 'fixtures', 'books_export_test.zip')
  writeFileSync(fixturePath, content)

  console.log(`Created test fixture: ${fixturePath}`)
  console.log('Books: 2')
  console.log('Notes: 1')
}

createFixture().catch(console.error)
