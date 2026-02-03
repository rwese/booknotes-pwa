import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('BookNotes PWA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
  })

  test('loads successfully and redirects to books', async ({ page }) => {
    await expect(page).toHaveTitle(/booknotes/i)
    await expect(page).toHaveURL(/\/books/)
  })

  test('shows empty state when no books exist', async ({ page }) => {
    await expect(page.locator('.empty-state-title')).toContainText('No books yet')
  })

  test('tab navigation works - books page', async ({ page }) => {
    await expect(page.locator('.tab-bar')).toBeVisible()
    await expect(page.locator('a[href="/books"]')).toBeVisible()
  })

  test('analytics page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Analytics')
  })

  test('scanner page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/scanner`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Scan ISBN')
  })

  test('settings page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Settings')
    await expect(page.locator('button:has-text("Export JSON")')).toBeVisible()
  })
})

test.describe('Book Creation Flow', () => {
  test('can navigate to Add Book form', async ({ page }) => {
    await page.goto(`${BASE_URL}/books/new`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Add New Book')
  })

  test('can create a new book with manual entry', async ({ page }) => {
    await page.goto(`${BASE_URL}/books/new`)
    await page.waitForLoadState('networkidle')

    // Fill in book details
    await page.fill('input[placeholder="Book title"]', 'Test Book Title')
    await page.fill('input[placeholder="Author name"]', 'Test Author')

    // Submit the form
    await page.click('button:has-text("Save Book")')

    // Should redirect to book detail page
    await page.waitForURL(/\/books\/[a-zA-Z0-9-]+/)

    // Should show the book title in h1
    await expect(page.locator('h1')).toContainText('Test Book Title')
  })
})

test.describe('Scanner Page', () => {
  test('displays scanner page with manual entry option', async ({ page }) => {
    await page.goto(`${BASE_URL}/scanner`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Scan ISBN')
    await expect(page.locator('input[placeholder*="ISBN"]')).toBeVisible()
    await expect(page.locator('button:has-text("Go")')).toBeVisible()
  })

  test('can manually enter an ISBN', async ({ page }) => {
    await page.goto(`${BASE_URL}/scanner`)
    await page.waitForLoadState('networkidle')

    // Enter a valid ISBN
    await page.fill('input[placeholder*="ISBN"]', '9780544003415')

    // Click Go
    await page.click('button:has-text("Go")')

    // Should navigate to add book with ISBN
    await page.waitForURL(/\/books\/new.*isbn=/)
  })
})
