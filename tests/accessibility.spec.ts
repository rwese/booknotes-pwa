import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test.describe('Books Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/booknotes-pwa/books')
      await page.waitForLoadState('networkidle')
    })

    test('books page has no axe violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('empty state is accessible', async ({ page }) => {
      // First clear any existing data
      await page.evaluate(async () => {
        const dbs = await indexedDB.databases()
        for (const db of dbs) {
          if (db.name) indexedDB.deleteDatabase(db.name)
        }
      })
      await page.reload()
      await page.waitForLoadState('networkidle')

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('tab bar is accessible', async ({ page }) => {
      const tabBar = page.locator('.tab-bar')
      await expect(tabBar).toBeVisible()

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Scanner Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/booknotes-pwa/scanner')
      await page.waitForLoadState('networkidle')
    })

    test('scanner page has no axe violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('ISBN input is accessible with proper labels', async ({ page }) => {
      const isbnInput = page.locator('input[placeholder*="ISBN"]')
      await expect(isbnInput).toBeVisible()

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Settings Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/booknotes-pwa/settings')
      await page.waitForLoadState('networkidle')
    })

    test('settings page has no axe violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('export buttons are accessible', async ({ page }) => {
      const exportJsonBtn = page.locator('button:has-text("Export JSON")')
      await expect(exportJsonBtn).toBeVisible()

      const exportZipBtn = page.locator('button:has-text("Export ZIP")')
      await expect(exportZipBtn).toBeVisible()

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Add Book Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/booknotes-pwa/books/new')
      await page.waitForLoadState('networkidle')
    })

    test('add book form has no axe violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('form inputs have proper accessibility attributes', async ({ page }) => {
      const titleInput = page.locator('input[placeholder="Book title"]')
      await expect(titleInput).toBeVisible()

      const authorInput = page.locator('input[placeholder="Author name"]')
      await expect(authorInput).toBeVisible()

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Analytics Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/booknotes-pwa/analytics')
      await page.waitForLoadState('networkidle')
    })

    test('analytics page has no axe violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    })
  })
})
