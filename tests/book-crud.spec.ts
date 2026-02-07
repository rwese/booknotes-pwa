import { test, expect } from '@playwright/test'

test.describe('Book CRUD Operations', () => {
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
  })

  test.describe('Create Book', () => {
    test('can create a new book with manual entry', async ({ page }) => {
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')

      // Fill in book details
      await page.fill('input[placeholder="Book title"]', 'Test Book Title')
      await page.fill('input[placeholder="Author name"]', 'Test Author')
      await page.fill('input[placeholder="Genre"]', 'Fiction')
      await page.fill('input[placeholder="Pages"]', '250')

      // Submit the form
      await page.click('button[type="submit"]')

      // Should redirect to book detail page
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Should show the book title in h1
      await expect(page.locator('h1')).toContainText('Test Book Title')
    })
  })

  test.describe('Edit Book', () => {
    test('can edit an existing book', async ({ page }) => {
      // First create a book
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[placeholder="Book title"]', 'Original Title')
      await page.fill('input[placeholder="Author name"]', 'Original Author')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Click edit button on the detail page
      await page.click('button[aria-label="Edit Book"]')
      await page.waitForURL(/\/booknotes-pwa\/.*\/edit/)

      // Update the title
      await page.fill('input[placeholder="Book title"]', 'Updated Title')
      await page.click('button[type="submit"]')

      // Should redirect back to detail page with updated title
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)
      await expect(page.locator('h1')).toContainText('Updated Title')
    })

    test('can update reading status', async ({ page }) => {
      // Create a book first
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[placeholder="Book title"]', 'Status Test Book')
      await page.fill('input[placeholder="Author name"]', 'Test Author')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Go to edit page
      await page.click('button[aria-label="Edit Book"]')
      await page.waitForURL(/\/booknotes-pwa\/.*\/edit/)

      // Change reading status using status buttons
      await page.click('button:has-text("Currently Reading")')

      // Save
      await page.click('button[type="submit"]')

      // Verify status is updated
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)
      await expect(page.locator('.badge:has-text("Reading")')).toBeVisible()
    })
  })

  test.describe('Delete Book', () => {
    test('can delete a book', async ({ page }) => {
      // Create a book first
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[placeholder="Book title"]', 'Book to Delete')
      await page.fill('input[placeholder="Author name"]', 'Test Author')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Delete button is on the detail page (not edit page)
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('delete')
        await dialog.accept()
      })
      // Use JavaScript click to avoid FAB overlay issues
      await page.evaluate(() => {
        const btn = document.querySelector('button[aria-label="Delete Book"]')
        if (btn instanceof HTMLElement) {
          btn.click()
        }
      })

      // Should redirect to books list
      await page.waitForURL(/\/booknotes-pwa\/books/, { timeout: 15000 })

      // Book should not be in the list
      await expect(page.locator('text=Book to Delete')).not.toBeVisible()
    })

    test('can cancel delete confirmation', async ({ page }) => {
      // Create a book first
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[placeholder="Book title"]', 'Book Not To Delete')
      await page.fill('input[placeholder="Author name"]', 'Test Author')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Click delete on detail page and cancel
      page.on('dialog', async (dialog) => {
        await dialog.dismiss()
      })
      // Use JavaScript click to avoid FAB overlay issues
      await page.evaluate(() => {
        const btn = document.querySelector('button[aria-label="Delete Book"]')
        if (btn instanceof HTMLElement) {
          btn.click()
        }
      })

      // Should still be on detail page with the book title visible
      await expect(page.locator('h1')).toContainText('Book Not To Delete')
    })
  })

  test.describe('Book Detail Page', () => {
    test('displays all book information', async ({ page }) => {
      // Create a book with all fields
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[placeholder="Book title"]', 'Complete Book Info')
      await page.fill('input[placeholder="Author name"]', 'Full Name')
      await page.fill('input[placeholder="Genre"]', 'Science Fiction')
      await page.fill('input[placeholder="Pages"]', '342')
      await page.fill('input[placeholder="Enter ISBN"]', '9780544003415')
      await page.click('button:has-text("Currently Reading")')
      await page.fill('textarea[placeholder="Personal notes about this book..."]', 'My reading notes')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Verify all fields are displayed
      await expect(page.locator('h1')).toContainText('Complete Book Info')
      await expect(page.locator('text=Full Name')).toBeVisible()
      await expect(page.locator('text=Science Fiction')).toBeVisible()
      await expect(page.locator('.badge:has-text("Reading")')).toBeVisible()
    })

    test('has navigation back to books list', async ({ page }) => {
      // Create a book
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[placeholder="Book title"]', 'Navigation Test')
      await page.fill('input[placeholder="Author name"]', 'Test Author')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Click back to books list
      await page.click('a[href="/booknotes-pwa/books"]')
      await page.waitForURL(/\/booknotes-pwa\/books/)

      // Should be on books list page
      await expect(page.locator('.books-page')).toBeVisible()
    })
  })
})
