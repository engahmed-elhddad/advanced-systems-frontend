import { requireAdminLoginEnv } from './load-e2e-env'
import { test, expect } from './fixtures/live-e2e'

/** Full login flow — do not reuse global `storageState` from global-setup. */
test.use({ storageState: { cookies: [], origins: [] } })

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'failed' && testInfo.status !== 'timedOut') return
  const msg = testInfo.error?.message ?? ''
  if (/ADMIN_LOGIN|ADMIN_EMAIL|E2E_ADMIN|PLAYWRIGHT_ADMIN|No admin (email|password)/i.test(msg)) {
    console.error(
      '[E2E admin login] Missing credentials. In frontend/.env.local set ADMIN_LOGIN_EMAIL + ADMIN_LOGIN_PASSWORD (or E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD).',
    )
    return
  }
  const url = page.url()
  const formError = await page.getByRole('alert').first().textContent().catch(() => null)
  console.error('[E2E admin login] failure context:', {
    url,
    formError: formError?.trim() || null,
    error: testInfo.error?.message ?? testInfo.error,
  })
})

test.describe('admin login (live E2E)', () => {
  test('logs in and lands on dashboard', async ({ page, context }) => {
    const { email, password } = requireAdminLoginEnv()

    await context.addInitScript(() => {
      window.localStorage.removeItem('admin_token')
      window.localStorage.removeItem('admin_user')
    })

    await page.goto('/admin/login', { waitUntil: 'load' })

    await expect(page.getByRole('heading', { name: 'Admin Login', level: 1 })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()

    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)

    await Promise.all([
      page.waitForURL(/\/admin\/?$/i, { timeout: 90_000 }),
      page.getByRole('button', { name: /sign in/i }).click(),
    ])

    await expect(page).toHaveURL(/\/admin\/?$/i)

    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
      timeout: 60_000,
    })
  })
})
