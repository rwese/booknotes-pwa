import { test, expect } from '@playwright/test'

test.describe('E2E - GitHub Pages Deployment', () => {
  test('builds and serves correctly for GitHub Pages', async ({ page }) => {
    // Test with base path (simulates production)
    await page.goto('/booknotes-pwa/books')
    await page.waitForLoadState('networkidle')

    // Verify base app functionality works
    await expect(page.locator('.app-shell')).toBeVisible()
    await expect(page.locator('.tab-bar')).toBeVisible()

    // Test navigation
    await page.click('a[href="/booknotes-pwa/analytics"]')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Analytics')

    await page.click('a[href="/booknotes-pwa/settings"]')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Settings')

    await page.click('a[href="/booknotes-pwa/scanner"]')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Scan ISBN')

    await page.click('a[href="/booknotes-pwa/books"]')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.books-page')).toBeVisible()
  })
})
