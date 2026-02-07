import { test, expect } from '@playwright/test'

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/booknotes-pwa/settings')
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases()
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name)
      }
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Create test books
    await page.goto('/booknotes-pwa/books/new')
    await page.waitForLoadState('networkidle')

    // Create book 1
    await page.fill('input[placeholder="Book title"]', 'The Great Gatsby')
    await page.fill('input[placeholder="Author name"]', 'F. Scott Fitzgerald')
    await page.fill('input[placeholder="Genre"]', 'Classic')
    await page.getByRole('button', { name: 'Read', exact: true }).click()
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)
    // Navigate directly to create another book
    await page.goto('/booknotes-pwa/books/new')
    await page.waitForLoadState('networkidle')

    // Create book 2
    await page.fill('input[placeholder="Book title"]', 'The Hobbit')
    await page.fill('input[placeholder="Author name"]', 'J.R.R. Tolkien')
    await page.fill('input[placeholder="Genre"]', 'Fantasy')
    await page.getByRole('button', { name: 'Currently Reading', exact: true }).click()
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)
    // Navigate directly to create another book
    await page.goto('/booknotes-pwa/books/new')
    await page.waitForLoadState('networkidle')

    // Create book 3
    await page.fill('input[placeholder="Book title"]', 'Clean Code')
    await page.fill('input[placeholder="Author name"]', 'Robert C. Martin')
    await page.fill('input[placeholder="Genre"]', 'Technology')
    await page.getByRole('button', { name: 'Want to Read', exact: true }).click()
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)
    await page.waitForLoadState('networkidle')

    // Go to books list using navigation
    await page.goto('/booknotes-pwa/books')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
  })

  /** Opens the search input by clicking the search toggle button */
  async function openSearch(page: any) {
    const searchToggle = page.locator('button[aria-label="Open search"]')
    if (await searchToggle.isVisible()) {
      await searchToggle.click()
    }
    return page.locator('input[placeholder*="Search"]')
  }

})
