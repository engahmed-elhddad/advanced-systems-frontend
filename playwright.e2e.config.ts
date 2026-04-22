import { defineConfig, devices } from '@playwright/test'
import { loadE2eEnv } from './tests/load-e2e-env'

loadE2eEnv()

const LIVE = 'https://advancedsystems-int.com'
const headed = process.env.PW_HEADED === '1' || process.env.HEADED === '1'

/** Saved by `tests/global-setup.ts` after health check + admin login. */
const ADMIN_STORAGE = 'playwright/.auth/admin.json'

export default defineConfig({
  /** Staging health + auth before any test file runs. */
  globalSetup: './tests/global-setup.ts',
  /** Runs after every run: purge `[E2E]` products, leak check, then AI analysis scripts. */
  globalTeardown: './tests/e2e-global-teardown.ts',
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  outputDir: './reports/test-results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: './reports/html', open: 'never' }],
    ['json', { outputFile: './reports/results.json' }],
  ],
  use: {
    baseURL: (process.env.PLAYWRIGHT_BASE_URL || process.env.E2E_BASE_URL || '').trim() || LIVE,
    ...devices['Desktop Chrome'],
    storageState: ADMIN_STORAGE,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    headless: !headed,
    navigationTimeout: 90_000,
    actionTimeout: 45_000,
  },
})
