import { defineConfig, devices } from '@playwright/test'
import { loadE2eEnv } from './tests/load-e2e-env'

/**
 * Default Playwright entry (`npx playwright test` without `-c`).
 * - Visual regression: `visual-tests/` (desktop + mobile).
 * - Live E2E: `tests/` (single Chrome worker; env via `loadE2eEnv()`).
 * For CI parity with reporters + global teardown, use: `npx playwright test -c playwright.e2e.config.ts`
 */
loadE2eEnv()

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://advancedsystems-int.com'

const visualExpect = {
  toHaveScreenshot: { threshold: 0.001, maxDiffPixelRatio: 0.001 },
}

export default defineConfig({
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    {
      name: 'visual-desktop',
      testDir: './visual-tests',
      snapshotDir: './visual-tests/snapshots',
      outputDir: './visual-tests/results',
      fullyParallel: true,
      expect: visualExpect,
      use: {
        baseURL: BASE_URL,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
        navigationTimeout: 60_000,
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'visual-mobile',
      testDir: './visual-tests',
      snapshotDir: './visual-tests/snapshots',
      outputDir: './visual-tests/results',
      fullyParallel: true,
      expect: visualExpect,
      use: {
        baseURL: BASE_URL,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
        navigationTimeout: 60_000,
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: 'e2e',
      testDir: './tests',
      testMatch: '**/*.spec.ts',
      outputDir: './reports/test-results',
      fullyParallel: false,
      workers: 1,
      expect: { timeout: 30_000 },
      use: {
        baseURL: BASE_URL,
        ...devices['Desktop Chrome'],
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        video: 'retain-on-failure',
        headless: !(process.env.PW_HEADED === '1' || process.env.HEADED === '1'),
        navigationTimeout: 90_000,
        actionTimeout: 45_000,
      },
    },
  ],
})
