import { test, expect } from '@playwright/test'

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/settings')
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases()
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name)
      }
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Create test books
    await page.goto('/books/new')
    await page.waitForLoadState('networkidle')

    // Create book 1
    await page.fill('input[placeholder="Book title"]', 'The Great Gatsby')
    await page.fill('input[placeholder="Author name"]', 'F. Scott Fitzgerald')
    await page.fill('input[placeholder="Genre"]', 'Classic')
    await page.selectOption('select', 'read')
    await page.click('button:has-text("Save Book")')
    await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)
    await page.click('a[href="/booknotes-pwa/books/new"]')
    await page.waitForLoadState('networkidle')

    // Create book 2
    await page.fill('input[placeholder="Book title"]', 'The Hobbit')
    await page.fill('input[placeholder="Author name"]', 'J.R.R. Tolkien')
    await page.fill('input[placeholder="Genre"]', 'Fantasy')
    await page.selectOption('select', 'currentlyReading')
    await page.click('button:has-text("Save Book")')
    await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)
    await page.click('a[href="/booknotes-pwa/books/new"]')
    await page.waitForLoadState('networkidle')

    // Create book 3
    await page.fill('input[placeholder="Book title"]', 'Clean Code')
    await page.fill('input[placeholder="Author name"]', 'Robert C. Martin')
    await page.fill('input[placeholder="Genre"]', 'Technology')
    await page.selectOption('select', 'wantToRead')
    await page.click('button:has-text("Save Book")')
    await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)
    await page.waitForLoadState('networkidle')

    // Go to books list
    await page.click('a[href="/booknotes-pwa/books"]')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
  })

  test.describe('Search', () => {
    test('can search books by title', async ({ page }) => {
      // Type in search box
      const searchInput = page.locator('input[placeholder*="Search"]')
      await searchInput.fill('Gatsby')

      // Wait for filter to apply
      await page.waitForTimeout(300)

      // Only one book should be visible
      await expect(page.locator('text=The Great Gatsby')).toBeVisible()
      await expect(page.locator('text=The Hobbit')).not.toBeVisible()
      await expect(page.locator('text=Clean Code')).not.toBeVisible()
    })

    test('can search books by author', async ({ page }) => {
      // Type in search box
      const searchInput = page.locator('input[placeholder*="Search"]')
      await searchInput.fill('Tolkien')

      // Wait for filter to apply
      await page.waitForTimeout(300)

      // Only The Hobbit should be visible
      await expect(page.locator('text=The Great Gatsby')).not.toBeVisible()
      await expect(page.locator('text=The Hobbit')).toBeVisible()
      await expect(page.locator('text=Clean Code')).not.toBeVisible()
    })

    test('search is case insensitive', async ({ page }) => {
      // Type in search box with different case
      const searchInput = page.locator('input[placeholder*="Search"]')
      await searchInput.fill('gATSBY')

      // Wait for filter to apply
      await page.waitForTimeout(300)

      // Should still find the book
      await expect(page.locator('text=The Great Gatsby')).toBeVisible()
    })

    test('clearing search shows all books', async ({ page }) => {
      // First filter down
      const searchInput = page.locator('input[placeholder*="Search"]')
      await searchInput.fill('Gatsby')
      await page.waitForTimeout(300)
      await expect(page.locator('text=The Great Gatsby')).toBeVisible()
      await expect(page.locator('text=The Hobbit')).not.toBeVisible()

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(300)

      // All books should be visible again
      await expect(page.locator('text=The Great Gatsby')).toBeVisible()
      await expect(page.locator('text=The Hobbit')).toBeVisible()
      await expect(page.locator('text=Clean Code')).toBeVisible()
    })
  })

  test.describe('Filter by Status', () => {
    test('can filter books by reading status', async ({ page }) => {
      // Find status filter dropdown
      const statusSelect = page.locator('select.form-input.filter-bar__select, select').first()
      await statusSelect.selectOption('read')

      // Wait for filter to apply
      await page.waitForTimeout(300)

      // Only "read" books should be visible
      await expect(page.locator('text=The Great Gatsby')).toBeVisible()
      await expect(page.locator('text=The Hobbit')).not.toBeVisible()
      await expect(page.locator('text=Clean Code')).not.toBeVisible()
    })

    test('can filter by currently reading', async ({ page }) => {
      const statusSelect = page.locator('select.form-input.filter-bar__select, select').first()
      await statusSelect.selectOption('currentlyReading')
      await page.waitForTimeout(300)

      await expect(page.locator('text=The Great Gatsby')).not.toBeVisible()
      await expect(page.locator('text=The Hobbit')).toBeVisible()
      await expect(page.locator('text=Clean Code')).not.toBeVisible()
    })

    test('can filter by want to read', async ({ page }) => {
      const statusSelect = page.locator('select.form-input.filter-bar__select, select').first()
      await statusSelect.selectOption('wantToRead')
      await page.waitForTimeout(300)

      await expect(page.locator('text=The Great Gatsby')).not.toBeVisible()
      await expect(page.locator('text=The Hobbit')).not.toBeVisible()
      await expect(page.locator('text=Clean Code')).toBeVisible()
    })
  })

  test.describe('Filter by Genre', () => {
    test('can filter books by genre', async ({ page }) => {
      // Find genre filter
      const genreSelect = page.locator('select').nth(1)
      await genreSelect.selectOption('Fantasy')
      await page.waitForTimeout(300)

      await expect(page.locator('text=The Great Gatsby')).not.toBeVisible()
      await expect(page.locator('text=The Hobbit')).toBeVisible()
      await expect(page.locator('text=Clean Code')).not.toBeVisible()
    })
  })

  test.describe('Combined Search and Filter', () => {
    test('search and filter can be combined', async ({ page }) => {
      // Filter by genre first
      const genreSelect = page.locator('select').nth(1)
      await genreSelect.selectOption('Classic')
      await page.waitForTimeout(200)

      // Search within genre
      const searchInput = page.locator('input[placeholder*="Search"]')
      await searchInput.fill('Great')
      await page.waitForTimeout(200)

      await expect(page.locator('text=The Great Gatsby')).toBeVisible()
      await expect(page.locator('text=The Hobbit')).not.toBeVisible()
    })
  })

  test.describe('Clear Filters', () => {
    test('can clear all filters at once', async ({ page }) => {
      // Apply multiple filters
      const statusSelect = page.locator('select.form-input.filter-bar__select, select').first()
      await statusSelect.selectOption('read')
      await page.waitForTimeout(200)
      await expect(page.locator('text=The Great Gatsby')).toBeVisible()
      await expect(page.locator('text=The Hobbit')).not.toBeVisible()

      // Click clear all button
      const clearButton = page.locator('button:has-text("Clear all")')
      await expect(clearButton).toBeVisible()
      await clearButton.click()
      await page.waitForTimeout(200)

      // All books should be visible again
      await expect(page.locator('text=The Great Gatsby')).toBeVisible()
      await expect(page.locator('text=The Hobbit')).toBeVisible()
      await expect(page.locator('text=Clean Code')).toBeVisible()
    })
  })
})
