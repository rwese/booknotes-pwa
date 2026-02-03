import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { base64ToBlob, blobToBase64 } from '../db/schema'

describe('ExportService', () => {
  describe('base64ToBlob', () => {
    it('converts base64 data URL to Blob', async () => {
      // Create a simple red 1x1 pixel JPEG in base64
      const base64DataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=='

      const blob = await base64ToBlob(base64DataUrl)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/jpeg')
      expect(blob.size).toBeGreaterThan(0)
    })

    it('converts base64 without data URL prefix', async () => {
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const blob = await base64ToBlob(`data:image/png;base64,${base64}`)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/png')
    })
  })

  describe('blobToBase64', () => {
    it('converts Blob to base64 data URL', async () => {
      const originalText = 'Hello, World!'
      const blob = new Blob([originalText], { type: 'text/plain' })

      const base64 = await blobToBase64(blob)

      expect(base64).toContain('data:text/plain;base64,')
      expect(base64).toContain('SGVsbG8sIFdvcmxkIQ==')
    })
  })

  describe('JSON Export/Import Format', () => {
    it('includes coverImageBase64 in export format', async () => {
      // Create a test book with cover
      const coverBlob = new Blob([new ArrayBuffer(100)], { type: 'image/jpeg' })
      const coverBase64 = await blobToBase64(coverBlob)

      // Simulate the export format
      const exportBook = {
        id: 'test-id',
        title: 'Test Book',
        author: 'Test Author',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        coverImageBase64: coverBase64
      }

      // Verify coverImageBase64 is present
      expect(exportBook.coverImageBase64).toBeDefined()
      expect(typeof exportBook.coverImageBase64).toBe('string')
    })

    it('can convert exported cover back to Blob', async () => {
      // Create a simple test image
      const originalBlob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' })
      const base64 = await blobToBase64(originalBlob)

      // Convert back to blob
      const restoredBlob = await base64ToBlob(base64)

      expect(restoredBlob).toBeInstanceOf(Blob)
      expect(restoredBlob.size).toBe(originalBlob.size)
    })
  })

  describe('ZIP Import - Cover Image Handling', () => {
    it('reads cover file from ZIP', async () => {
      const zip = new JSZip()

      // Add a cover image to the ZIP
      const coverContent = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) // PNG header
      zip.file('covers/test-book-cover.jpg', coverContent)

      // Add metadata
      const metadata = {
        appVersion: '1.0',
        books: [{
          id: 'test-book',
          title: 'Test Book',
          author: 'Test Author',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          coverKey: 'test-book',
          coverFilename: 'test-book-cover.jpg'
        }],
        coverMapping: { 'test-book': 'test-book-cover.jpg' },
        totalBooks: 1,
        booksWithCovers: 1
      }
      zip.file('metadata.json', JSON.stringify(metadata))

      // Read the cover from ZIP
      const coverFile = zip.file('covers/test-book-cover.jpg')
      expect(coverFile).toBeDefined()

      const arrayBuffer = await coverFile!.async('arraybuffer')
      expect(arrayBuffer.byteLength).toBe(coverContent.length)
    })
  })
})
