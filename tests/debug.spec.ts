import { test, expect } from '@playwright/test'

test('debug books/new', async ({ page }) => {
  await page.goto('/booknotes-pwa/books/new')
  await page.waitForLoadState('networkidle')
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/books-new-screenshot.png', fullPage: true })
  
  // Get page content
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 3000))
  console.log('=== PAGE HTML ===')
  console.log(bodyHTML)
  console.log('=== END HTML ===')
  
  // Check what h1 elements exist
  const h1s = await page.locator('h1').all()
  for (const h1 of h1s) {
    console.log('H1 text:', await h1.textContent())
  }
  
  // Check for the form
  const forms = await page.locator('form').count()
  console.log('Forms count:', forms)
  
  // Check for inputs
  const inputs = await page.locator('input').all()
  for (const input of inputs) {
    const placeholder = await input.getAttribute('placeholder')
    const type = await input.getAttribute('type')
    console.log(`Input: type=${type}, placeholder=${placeholder}`)
  }
})
