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
      await page.fill('input[placeholder="Number of pages"]', '250')

      // Submit the form
      await page.click('button:has-text("Save Book")')

      // Should redirect to book detail page
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Should show the book title in h1
      await expect(page.locator('h1')).toContainText('Test Book Title')
    })

    test('shows validation errors for empty required fields', async ({ page }) => {
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')

      // Try to submit without filling required fields
      await page.click('button:has-text("Save Book")')

      // Should show validation error
      await expect(page.locator('.error-message, .error, [class*="error"]').first()).toBeVisible()
    })
  })

  test.describe('Edit Book', () => {
    test('can edit an existing book', async ({ page }) => {
      // First create a book
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[placeholder="Book title"]', 'Original Title')
      await page.fill('input[placeholder="Author name"]', 'Original Author')
      await page.click('button:has-text("Save Book")')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Click edit button
      await page.click('button:has-text("Edit")')
      await page.waitForURL(/\/booknotes-pwa\/.*\/edit/)

      // Update the title
      await page.fill('input[placeholder="Book title"]', 'Updated Title')
      await page.click('button:has-text("Save Book")')

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
      await page.click('button:has-text("Save Book")')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Go to edit page
      await page.click('button:has-text("Edit")')
      await page.waitForURL(/\/booknotes-pwa\/.*\/edit/)

      // Change reading status
      const statusSelect = page.locator('select')
      await statusSelect.selectOption('currentlyReading')

      // Save
      await page.click('button:has-text("Save Book")')

      // Verify status is updated
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)
      await expect(page.locator('text=Currently Reading')).toBeVisible()
    })
  })

  test.describe('Delete Book', () => {
    test('can delete a book', async ({ page }) => {
      // Create a book first
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[placeholder="Book title"]', 'Book to Delete')
      await page.fill('input[placeholder="Author name"]', 'Test Author')
      await page.click('button:has-text("Save Book")')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Go to edit page
      await page.click('button:has-text("Edit")')
      await page.waitForURL(/\/booknotes-pwa\/.*\/edit/)

      // Click delete button
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('delete')
        await dialog.accept()
      })
      await page.click('button:has-text("Delete")')

      // Should redirect to books list
      await page.waitForURL(/\/booknotes-pwa\/books/)

      // Book should not be in the list
      await expect(page.locator('text=Book to Delete')).not.toBeVisible()
    })

    test('can cancel delete confirmation', async ({ page }) => {
      // Create a book first
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[placeholder="Book title"]', 'Book Not To Delete')
      await page.fill('input[placeholder="Author name"]', 'Test Author')
      await page.click('button:has-text("Save Book")')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Go to edit page
      await page.click('button:has-text("Edit")')
      await page.waitForURL(/\/booknotes-pwa\/.*\/edit/)

      // Click delete and cancel
      page.on('dialog', async (dialog) => {
        await dialog.dismiss()
      })
      await page.click('button:has-text("Delete")')

      // Should still be on edit page
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
      await page.fill('input[placeholder="Number of pages"]', '342')
      await page.fill('input[placeholder="ISBN"]', '9780544003415')
      await page.selectOption('select', 'currentlyReading')
      await page.fill('textarea[placeholder="Notes"]', 'My reading notes')
      await page.click('button:has-text("Save Book")')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Verify all fields are displayed
      await expect(page.locator('h1')).toContainText('Complete Book Info')
      await expect(page.locator('text=Full Name')).toBeVisible()
      await expect(page.locator('text=Science Fiction')).toBeVisible()
      await expect(page.locator('text=Currently Reading')).toBeVisible()
    })

    test('has navigation back to books list', async ({ page }) => {
      // Create a book
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[placeholder="Book title"]', 'Navigation Test')
      await page.fill('input[placeholder="Author name"]', 'Test Author')
      await page.click('button:has-text("Save Book")')
      await page.waitForURL(/\/booknotes-pwa\/books\/[a-zA-Z0-9-]+/)

      // Click back button or link
      await page.click('a[href="/booknotes-pwa/books"]')
      await page.waitForURL(/\/booknotes-pwa\/books/)

      // Should be on books list
      await expect(page.locator('h1')).toContainText('Books')
    })
  })
})
