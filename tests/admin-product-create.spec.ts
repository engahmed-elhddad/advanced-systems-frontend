import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { test } from './fixtures/live-e2e'
import { getApiBaseUrl } from './e2e-target'
import { cleanupTrackedAndTaggedOrphans } from './e2e-cleanup'
import { ensureAdminSession } from './e2e-session'
import { E2E_FAIL, e2eLog, newE2EProductBundle, uniquePartNumber, uniqueProductName } from './e2e-isolation'

/** Fixture path relative to frontend cwd (matches `playwright.e2e.config.ts` testDir ./tests). */
const E2E_PNG_FIXTURE = 'tests/fixtures/e2e-1x1.png'

/** Product ids created during a test — deleted in afterEach when possible. */
const trackedProductIds = new Set<number>()

function resolveApiBaseUrl(): string {
  return getApiBaseUrl()
}

function tenantId(): string {
  return (process.env.NEXT_PUBLIC_TENANT_ID || 'default').trim() || 'default'
}

async function authHeaders(page: Page): Promise<Record<string, string>> {
  const token = await page.evaluate(() => localStorage.getItem('admin_token'))
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId(),
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function extractCreatedProductId(body: unknown): number | undefined {
  if (!body || typeof body !== 'object') return undefined
  const o = body as Record<string, unknown>
  if (typeof o.id === 'number' && Number.isFinite(o.id)) return o.id
  if (typeof o.id === 'string' && /^\d+$/.test(o.id)) return parseInt(o.id, 10)
  const inner = o.data
  if (inner && typeof inner === 'object') {
    const id = (inner as { id?: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
    if (typeof id === 'string' && /^\d+$/.test(id)) return parseInt(id, 10)
  }
  return undefined
}

/**
 * Radix Select (portal): open combobox by accessible name, pick option by label.
 */
async function selectComboboxOption(page: Page, comboboxName: string, optionName: RegExp | string): Promise<void> {
  await page.getByRole('combobox', { name: comboboxName }).click()
  const opt =
    typeof optionName === 'string'
      ? page.getByRole('option', { name: optionName, exact: true })
      : page.getByRole('option', { name: optionName })
  await expect(opt.first(), `${E2E_FAIL.UI} combobox "${comboboxName}" must list options`).toBeVisible()
  await opt.first().click()
}

async function fillCreateProductForm(
  page: Page,
  opts: {
    name: string
    partNumber: string
    description: string
  },
): Promise<void> {
  await expect(page.getByTestId('admin-product-form'), `${E2E_FAIL.UI} product form must mount`).toBeVisible({
    timeout: 60_000,
  })
  await page.getByLabel('Name').fill(opts.name)
  await page.getByLabel('Part number').fill(opts.partNumber)
  await selectComboboxOption(page, 'Brand', /.*/)
  await selectComboboxOption(page, 'Category', /.*/)
  await selectComboboxOption(page, 'Status', /^Draft$/)
  await page.getByPlaceholder('Write a concise product description...').fill(opts.description)
  await page.locator('input[type="file"][aria-label="Upload product image"]').setInputFiles(E2E_PNG_FIXTURE)
}

test.afterEach(async ({ page, request }, testInfo) => {
  const ids = [...trackedProductIds]
  trackedProductIds.clear()
  const { deleted } = await cleanupTrackedAndTaggedOrphans(page, request, testInfo, ids)
  e2eLog(testInfo, `afterEach: cleanup deleted=${deleted} (tracked ids + tag-based fallback)`)
})

test.describe('admin — create product (live E2E)', () => {
  test('happy path: create product, redirect to list, row visible', async ({ page, context }, testInfo) => {
    const { partNumber, productName } = newE2EProductBundle('HAPPY')
    e2eLog(testInfo, `isolation: happy path part_number=${partNumber} name=${productName}`)

    await ensureAdminSession(page, context)

    await page.goto('/admin/products/new', { waitUntil: 'load' })
    await expect(page.getByTestId('admin-create-product-page'), `${E2E_FAIL.UI} create product page shell`).toBeVisible({
      timeout: 60_000,
    })
    await expect(page.getByTestId('admin-create-product-heading')).toHaveText(/create product/i)
    await expect(page.getByTestId('admin-product-form-ready'), `${E2E_FAIL.UI} catalogs loaded; form ready`).toBeVisible({
      timeout: 90_000,
    })

    await fillCreateProductForm(page, {
      name: productName,
      partNumber,
      description: 'Playwright E2E description — filled to satisfy recommended fields.',
    })

    const postProducts = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/api/v1/admin/products') &&
        !res.url().includes('/images'),
    )

    page.once('dialog', (d) => d.accept())

    await page.getByTestId('admin-product-save').click()

    const created = await postProducts
    const st = created.status()
    const statusHint =
      st === 401 || st === 403
        ? E2E_FAIL.AUTH
        : st === 409
          ? E2E_FAIL.DATA_CONFLICT
          : E2E_FAIL.NETWORK
    expect(st, `${statusHint} POST /api/v1/admin/products expected 201, got HTTP ${st}`).toBe(201)

    const body = await created.json()
    const id = extractCreatedProductId(body)
    expect(id, `${E2E_FAIL.BUG} response must include numeric product id`).toBeTruthy()
    if (id != null) {
      trackedProductIds.add(id)
      e2eLog(testInfo, `API: created product id=${id} part_number=${partNumber}`)
    }

    await page.waitForURL(/\/admin\/products\/?(\?.*)?$/i, { timeout: 60_000 })
    await expect(page).toHaveURL(/\/admin\/products/)

    await expect(page.getByText(productName, { exact: true }), `${E2E_FAIL.BUG} new row must appear in list`).toBeVisible({
      timeout: 30_000,
    })
  })

  test('duplicate part_number: API error, stay on form, validation visible', async ({ page, context, request }, testInfo) => {
    await ensureAdminSession(page, context)

    const base = resolveApiBaseUrl()
    const headers = await authHeaders(page)
    expect(headers.Authorization, `${E2E_FAIL.AUTH} Bearer token required for API seed`).toBeTruthy()

    const partNumber = uniquePartNumber('DUP')
    const seedName = uniqueProductName('Seed')
    e2eLog(testInfo, `isolation: duplicate scenario seed part_number=${partNumber} seed_name=${seedName}`)

    const brandsRes = await request.get(`${base}/api/v1/brands/`, { headers })
    expect(brandsRes.ok(), `${E2E_FAIL.NETWORK} GET /api/v1/brands/ → HTTP ${brandsRes.status()}`).toBeTruthy()
    const brandsJson = await brandsRes.json()
    const brands = Array.isArray(brandsJson) ? brandsJson : (brandsJson as { brands?: unknown[] }).brands ?? []
    const firstBrandId = brands.length > 0 ? Number((brands[0] as { id: number }).id) : null

    const catRes = await request.get(`${base}/api/v1/categories/`, { headers })
    expect(catRes.ok(), `${E2E_FAIL.NETWORK} GET /api/v1/categories/ → HTTP ${catRes.status()}`).toBeTruthy()
    const catJson = await catRes.json()
    const cats = Array.isArray(catJson) ? catJson : (catJson as { categories?: unknown[] }).categories ?? []
    const firstCatId = cats.length > 0 ? Number((cats[0] as { id: number }).id) : null

    const seedPayload: Record<string, unknown> = {
      part_number: partNumber,
      name: seedName,
      stock_quantity: 1,
      is_active: false,
      specs: [],
    }
    if (firstBrandId != null && Number.isFinite(firstBrandId)) seedPayload.brand_id = firstBrandId
    if (firstCatId != null && Number.isFinite(firstCatId)) seedPayload.category_id = firstCatId

    const seedPost = await request.post(`${base}/api/v1/admin/products`, {
      headers,
      data: seedPayload,
    })
    expect(seedPost.status(), `${E2E_FAIL.NETWORK} seed POST must be 201 (got ${seedPost.status()})`).toBe(201)
    const seedBody = await seedPost.json()
    const seedId = extractCreatedProductId(seedBody)
    expect(seedId, `${E2E_FAIL.BUG} seed response must include id`).toBeTruthy()
    if (seedId != null) {
      trackedProductIds.add(seedId)
      e2eLog(testInfo, `API: seeded duplicate-test product id=${seedId} part_number=${partNumber}`)
    }

    await page.goto('/admin/products/new', { waitUntil: 'load' })
    await expect(page.getByTestId('admin-product-form-ready'), `${E2E_FAIL.UI} form ready after navigation`).toBeVisible({
      timeout: 90_000,
    })

    await fillCreateProductForm(page, {
      name: uniqueProductName('DupUI'),
      partNumber,
      description: 'Attempt duplicate PN — should fail with validation.',
    })

    const postDup = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/api/v1/admin/products') &&
        !res.url().includes('/images'),
    )

    page.once('dialog', (d) => d.accept())

    await page.getByTestId('admin-product-save').click()

    const dupRes = await postDup
    expect(dupRes.status(), `${E2E_FAIL.BUG} duplicate submit must return 409, not ${dupRes.status()}`).toBe(409)

    await expect(page).toHaveURL(/\/admin\/products\/new/)
    await expect(page.getByRole('alert'), `${E2E_FAIL.DATA_CONFLICT} inline duplicate message`).toContainText(
      /part number already exists/i,
    )
  })
})
