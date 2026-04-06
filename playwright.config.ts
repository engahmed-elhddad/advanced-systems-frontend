import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './visual-tests',
  snapshotDir: './visual-tests/snapshots',
  outputDir: './visual-tests/results',
  expect: {
    toHaveScreenshot: { threshold: 0.001, maxDiffPixelRatio: 0.001 },
  },
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3003',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3003',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
