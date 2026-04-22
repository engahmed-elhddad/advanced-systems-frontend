import type { BrowserContext, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { requireAdminLoginEnv } from './load-e2e-env'

/**
 * Use saved `storageState` when possible. If redirected to login (expired / missing), perform full login once.
 */
export async function ensureAdminSession(page: Page, context: BrowserContext): Promise<void> {
  await page.goto('/admin', { waitUntil: 'load', timeout: 90_000 })
  if (!/\/admin\/login/i.test(page.url())) {
    await expect(page.locator('main')).toBeVisible({ timeout: 30_000 })
    return
  }

  const { email, password } = requireAdminLoginEnv()

  await context.addInitScript(() => {
    window.localStorage.removeItem('admin_token')
    window.localStorage.removeItem('admin_user')
  })

  await page.goto('/admin/login', { waitUntil: 'load', timeout: 90_000 })
  await expect(page.getByRole('heading', { name: 'Admin Login', level: 1 })).toBeVisible({ timeout: 30_000 })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await Promise.all([
    page.waitForURL(/\/admin\/?$/i, { timeout: 90_000 }),
    page.getByRole('button', { name: /sign in/i }).click(),
  ])
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({ timeout: 60_000 })
}
