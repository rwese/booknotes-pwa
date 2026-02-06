import { test, expect } from '@playwright/test'

test.describe('BookNotes PWA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/booknotes-pwa/books')
    await page.waitForLoadState('networkidle')
  })

  test('shows books page with content', async ({ page }) => {
    await expect(page.locator('.books-page')).toBeVisible()
    await expect(page.locator('.tab-bar')).toBeVisible()
  })

  test('shows empty state when no books exist', async ({ page }) => {
    await expect(page.locator('.empty-state-title')).toContainText('No books yet')
  })

  test('tab navigation works - books page', async ({ page }) => {
    await expect(page.locator('.tab-bar')).toBeVisible()
    await expect(page.locator('a[href="/booknotes-pwa/books"]')).toBeVisible()
  })

  test('analytics page loads', async ({ page }) => {
    await page.goto('/booknotes-pwa/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Analytics')
  })

  test('scanner page loads', async ({ page }) => {
    await page.goto('/booknotes-pwa/scanner')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Scan ISBN')
  })

  test('settings page loads', async ({ page }) => {
    await page.goto('/booknotes-pwa/settings')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Settings')
    await expect(page.locator('button:has-text("Export JSON")')).toBeVisible()
  })
})

test.describe('Book Creation Flow', () => {
  test('can navigate to Add Book form', async ({ page }) => {
    await page.goto('/booknotes-pwa/books/new')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Add New Book')
  })

  test('can create a new book with manual entry', async ({ page }) => {
    await page.goto('/booknotes-pwa/books/new')
    await page.waitForLoadState('networkidle')

    // Fill in book details - title and author are required
    await page.fill('input[placeholder="Book title"]', 'Test Book Title')
    await page.fill('input[placeholder="Author name"]', 'Test Author')
    await page.fill('input[placeholder="Genre"]', 'Fiction')

    // Submit the form
    await page.click('button[type="submit"]')

    // Should redirect to book detail page
    await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

    // Should show the book title
    await expect(page.locator('.book-detail__title')).toContainText('Test Book Title')
  })
})

test.describe('Scanner Page', () => {
  test('displays scanner page with manual entry option', async ({ page }) => {
    await page.goto('/booknotes-pwa/scanner')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Scan ISBN')
    await expect(page.locator('input[placeholder*="ISBN"]')).toBeVisible()
    await expect(page.locator('button:has-text("Go")')).toBeVisible()
  })

  test('can manually enter an ISBN', async ({ page }) => {
    await page.goto('/booknotes-pwa/scanner')
    await page.waitForLoadState('networkidle')

    // Enter a valid ISBN
    await page.fill('input[placeholder*="ISBN"]', '9780544003415')

    // Click Go
    await page.click('button:has-text("Go")')

    // Should navigate to add book with ISBN
    await page.waitForURL(/\/booknotes-pwa\/books\/new.*isbn=/)
  })
})
