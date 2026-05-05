/**
 * Spec 017 US3 — admin warehouses (live E2E).
 * Requires ADMIN_LOGIN_EMAIL + ADMIN_LOGIN_PASSWORD in frontend/.env.local.
 */
import { expect, test } from './fixtures/live-e2e'
import { ensureAdminSession } from './e2e-session'

/** 2–8 uppercase letters only (matches admin form validation). */
function uniqueWarehouseCode(prefix: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  let tail = ''
  let n = Date.now()
  for (let i = 0; i < 5; i++) {
    tail += alphabet[n % alphabet.length]
    n = Math.floor(n / alphabet.length)
  }
  return `${prefix}${tail}`.slice(0, 8)
}

test.describe('Admin warehouses (017)', () => {
  test.beforeEach(async ({ page, context }) => {
    await ensureAdminSession(page, context)
  })

  test('lists warehouses and creates a unique warehouse', async ({ page }) => {
    await page.goto('/admin/warehouses', { waitUntil: 'load', timeout: 90_000 })
    await expect(page.getByRole('heading', { name: /^Warehouses$/i })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('admin-warehouses-table')).toBeVisible()

    const suffix = Date.now().toString().slice(-6)
    const code = uniqueWarehouseCode('W')

    await page.getByTestId('admin-warehouse-add').click()
    await expect(page.getByRole('heading', { name: /Add warehouse/i })).toBeVisible()
    await page.getByLabel('Warehouse code').fill(code)
    await page.getByLabel('Name (EN)').fill(`Test ${suffix}`)
    await page.getByLabel('Name (AR)').fill(`اختبار ${suffix}`)
    await page.getByLabel('Country code').fill('AE')

    await page.getByRole('button', { name: /^Save$/i }).click()
    await expect(page.getByTestId(`admin-warehouse-row-${code}`)).toBeVisible({ timeout: 30_000 })
  })

  test('edit updates lead time (no code field)', async ({ page }) => {
    await page.goto('/admin/warehouses', { waitUntil: 'load', timeout: 90_000 })
    await expect(page.getByTestId('admin-warehouses-table')).toBeVisible({ timeout: 30_000 })

    const firstEdit = page.getByRole('button', { name: /^Edit$/i }).first()
    await expect(firstEdit).toBeVisible({ timeout: 15_000 })
    await firstEdit.click()

    await expect(page.getByLabel('Warehouse code')).toHaveCount(0)
    await page.getByLabel('Default lead time days (optional)').fill('7')
    await page.getByRole('button', { name: /^Save$/i }).click()
    await expect(page.getByRole('heading', { name: /Edit /i })).not.toBeVisible({ timeout: 15_000 })
  })

  test('duplicate code shows inline error', async ({ page }) => {
    await page.goto('/admin/warehouses', { waitUntil: 'load', timeout: 90_000 })
    const suffix = Date.now().toString().slice(-6)
    const code = uniqueWarehouseCode('D')

    await page.getByTestId('admin-warehouse-add').click()
    await page.getByLabel('Warehouse code').fill(code)
    await page.getByLabel('Name (EN)').fill('Dup A')
    await page.getByLabel('Name (AR)').fill('دوبلكس أ')
    await page.getByLabel('Country code').fill('SA')
    await page.getByRole('button', { name: /^Save$/i }).click()
    await expect(page.getByTestId(`admin-warehouse-row-${code}`)).toBeVisible({ timeout: 30_000 })

    await page.getByTestId('admin-warehouse-add').click()
    await page.getByLabel('Warehouse code').fill(code)
    await page.getByLabel('Name (EN)').fill('Dup B')
    await page.getByLabel('Name (AR)').fill('دوبلكس ب')
    await page.getByLabel('Country code').fill('SA')
    await page.getByRole('button', { name: /^Save$/i }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })
  })

  test('invalid country blocked client-side', async ({ page }) => {
    await page.goto('/admin/warehouses', { waitUntil: 'load', timeout: 90_000 })
    await page.getByTestId('admin-warehouse-add').click()
    await page.getByLabel('Warehouse code').fill(uniqueWarehouseCode('X'))
    await page.getByLabel('Name (EN)').fill('Bad country')
    await page.getByLabel('Name (AR)').fill('بلد')
    await page.getByLabel('Country code').fill('e1')
    await page.getByRole('button', { name: /^Save$/i }).click()
    await expect(page.getByRole('alert')).toContainText(/Country|ISO/i)
  })

  test('disable greys out row', async ({ page }) => {
    await page.goto('/admin/warehouses', { waitUntil: 'load', timeout: 90_000 })
    const suffix = Date.now().toString().slice(-6)
    const code = uniqueWarehouseCode('Z')

    await page.getByTestId('admin-warehouse-add').click()
    await page.getByLabel('Warehouse code').fill(code)
    await page.getByLabel('Name (EN)').fill('To disable')
    await page.getByLabel('Name (AR)').fill('تعطيل')
    await page.getByLabel('Country code').fill('KW')
    await page.getByRole('button', { name: /^Save$/i }).click()
    const row = page.getByTestId(`admin-warehouse-row-${code}`)
    await expect(row).toBeVisible({ timeout: 30_000 })

    await row.getByRole('button', { name: /^Disable$/i }).click()
    await expect(row).toHaveClass(/opacity-50/)
  })
})

test.describe('Admin warehouses auth gate', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('redirects to login without admin token', async ({ page, context }) => {
    await context.addInitScript(() => {
      window.localStorage.removeItem('admin_token')
      window.localStorage.removeItem('admin_user')
    })
    await page.goto('/admin/warehouses', { waitUntil: 'load', timeout: 90_000 })
    await expect(page).toHaveURL(/\/admin\/login/i)
  })
})
