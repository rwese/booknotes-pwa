import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,  // Disable retries in CI to speed up pipeline
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5180/booknotes-pwa',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
