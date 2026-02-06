import { test, expect } from '@playwright/test'

test.describe('Import Native Export', () => {
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
  })

  async function importFile(page: any) {
    // Upload the test export
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.click('input[type="file"]')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles('./tests/fixtures/books_export_test.zip')

    // Wait for the Import button to become enabled
    await page.waitForFunction(() => {
      const buttons = document.querySelectorAll('button')
      for (const btn of buttons) {
        if (btn.textContent?.includes('Import') && !btn.disabled && btn.textContent.trim() === 'Import') {
          return true
        }
      }
      return false
    }, { timeout: 10000 })

    // Click the Import button (shows confirmation modal)
    await page.getByRole('button', { name: 'Import' }).click()

    // Wait for confirmation modal
    await page.waitForSelector('.modal-content', { timeout: 5000 })

    // Click the Import button in the confirmation modal via JS
    await page.evaluate(() => {
      const modalButtons = document.querySelectorAll('.modal-content button')
      for (const btn of modalButtons) {
        if (btn.textContent?.trim() === 'Import') {
          (btn as HTMLButtonElement).click()
          return
        }
      }
    })

    // Wait for import to complete
    await page.waitForSelector('.card:has-text("Import Result")', { timeout: 300000 })
  }

  test('can import native export with 2 books', async ({ page }) => {
    await importFile(page)

    // Check import result
    const importResult = page.locator('.card:has-text("Import Result")')
    const resultText = await importResult.textContent()
    expect(resultText).toContain('imported')

    // Dismiss
    await page.click('.card:has-text("Import Result") button:has-text("Dismiss")')

    // Go to books page
    await page.goto('/books')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check that books are displayed
    await expect(page.locator('text=Test Book One')).toBeVisible()
    await expect(page.locator('text=Test Book Two')).toBeVisible()
  })

  test('imported book shows correct data in edit form', async ({ page }) => {
    await importFile(page)

    // Dismiss
    await page.click('.card:has-text("Import Result") button:has-text("Dismiss")')

    // Go to edit page for first book
    await page.goto('/books/test-book-1/edit')
    await page.waitForLoadState('networkidle')

    // Verify title field has value
    const titleInput = page.locator('input[placeholder="Book title"]')
    await expect(titleInput).toHaveValue('Test Book One')

    // Verify author field has value
    const authorInput = page.locator('input[placeholder="Author name"]')
    await expect(authorInput).toHaveValue('Test Author One')

    // Verify genre field has value
    const genreInput = page.locator('input[placeholder="Genre"]')
    await expect(genreInput).toHaveValue('Fiction')
  })
})
