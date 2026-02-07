import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5180/booknotes-pwa',
    trace: 'on-first-retry',
    headless: true,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'GITHUB_PAGES=true npx vite build && GITHUB_PAGES=true npx vite preview --port 5180',
    port: 5180,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
