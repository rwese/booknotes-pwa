import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Import Native Export', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto(`${BASE_URL}/settings`)
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
    await fileChooser.setFiles('/Users/wese/Downloads/books_export_archive.zip')

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

  test('can import native export with 177 books and cover thumbnails', async ({ page }) => {
    await importFile(page)

    // Check import result
    const importResult = page.locator('.card:has-text("Import Result")')
    const resultText = await importResult.textContent()
    expect(resultText).toContain('177')
    expect(resultText).toContain('imported')

    // Dismiss
    await page.click('.card:has-text("Import Result") button:has-text("Dismiss")')

    // Go to books page
    await page.goto(`${BASE_URL}/books`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check that 177 books are displayed in the table
    const tableRows = page.locator('tbody tr')
    await expect(tableRows).toHaveCount(177)

    // Check first row has a cover image
    const firstRow = tableRows.first()
    const coverImage = firstRow.locator('img')
    await expect(coverImage).toBeVisible()

    // Check table headers
    await expect(page.locator('th:has-text("Title")')).toBeVisible()
    await expect(page.locator('th:has-text("Author")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
  })

  test('imported book shows correct data in edit form', async ({ page }) => {
    await importFile(page)

    // Dismiss
    await page.click('.card:has-text("Import Result") button:has-text("Dismiss")')

    // Go directly to edit page for a known book from the export
    // First book in the export is "A Rare Interest In Corpses" by Ann Granger
    await page.goto(`${BASE_URL}/books/1F75D121-47F2-494E-B916-B07F2A6983E4/edit`)
    await page.waitForLoadState('networkidle')

    // Verify title field has value
    const titleInput = page.locator('input[placeholder="Book title"]')
    await expect(titleInput).toHaveValue('A Rare Interest In Corpses')

    // Verify author field has value
    const authorInput = page.locator('input[placeholder="Author name"]')
    await expect(authorInput).toHaveValue('Ann Granger')

    // Verify genre field has value
    const genreInput = page.locator('input[placeholder="Genre"]')
    await expect(genreInput).toHaveValue('Crime')

    // Note: ISBN field is only shown in create mode, not edit mode

    // Verify reading status is correct (Want to Read -> wantToRead)
    const statusSelect = page.locator('select.form-input')
    await expect(statusSelect).toHaveValue('wantToRead')

    // Verify publisher field
    const publisherInput = page.locator('input[placeholder="Publisher"]')
    await expect(publisherInput).toHaveValue('Headline Publishing Group')

    // Verify page count
    const pageCountInput = page.locator('input[placeholder="Number of pages"]')
    await expect(pageCountInput).toHaveValue('410')
  })
})
