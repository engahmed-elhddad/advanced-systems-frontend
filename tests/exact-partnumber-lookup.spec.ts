/**
 * Spec 010 US1 — exact part-number lookup from global header search.
 */
import type { APIRequestContext } from '@playwright/test'
import { test, expect } from './fixtures/live-e2e'
import { getApiBaseUrl } from './e2e-target'

const HIDDEN_PART_NUMBER = (process.env.E2E_HIDDEN_PART_NUMBER || '').trim()

type ProductListItem = {
  part_number?: string
  slug?: string
}

function lookupVariants(partNumber: string): string[] {
  const canonical = partNumber.trim()
  const compact = canonical.replace(/[\s\-_/]/g, '')
  return [
    canonical,
    canonical.toLowerCase(),
    canonical.replace(/[\s\-_/]+/g, ' '),
    canonical.replace(/[\s\-_/]+/g, '_'),
    canonical.replace(/[\s\-_/]+/g, '/'),
    compact.toLowerCase(),
  ]
}

async function discoverExactLookupFixture(request: APIRequestContext) {
  const base = getApiBaseUrl()
  const res = await request.get(`${base}/api/v1/products?limit=100`)
  expect(res.ok(), `GET public products for Spec 010 fixture returned ${res.status()}`).toBeTruthy()
  const body = await res.json()
  const items = Array.isArray(body) ? body : ((body as { items?: ProductListItem[] }).items ?? [])
  const product = items.find((item) => {
    const partNumber = (item.part_number ?? '').trim()
    const slug = (item.slug ?? '').trim()
    return slug && /[A-Za-z]/.test(partNumber) && /[\s\-_/]/.test(partNumber)
  })
  test.skip(!product, 'Public catalog needs one published product with letters and separators for Spec 010 E2E')
  return {
    partNumber: String(product?.part_number || ''),
    slug: String(product?.slug || ''),
  }
}

test.describe('Exact part-number lookup (010 US1)', () => {
  test('six header-search variants land on same PDP', async ({ page, request }) => {
    const fixture = await discoverExactLookupFixture(request)
    const probe = await request.get(`${getApiBaseUrl()}/api/v1/products/part/${encodeURIComponent(fixture.partNumber)}`)
    expect(probe.ok(), `lookup fixture ${fixture.partNumber} should resolve through part lookup API`).toBeTruthy()

    const payload = (await probe.json()) as { slug?: string }
    const expectedSlug = (payload.slug ?? fixture.slug).trim()
    expect(expectedSlug, 'Product response missing slug').toBeTruthy()

    const searchForm = page.locator('form[role="search"]')
    const searchInput = searchForm.locator('input[type="search"]')

    for (const q of lookupVariants(fixture.partNumber)) {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(searchInput).toBeVisible({ timeout: 30_000 })
      await searchInput.fill(q)
      await Promise.all([
        page.waitForURL(
          (url) => {
            const path = url.pathname
            return path === `/products/${expectedSlug}` || path === `/products/${encodeURIComponent(expectedSlug)}`
          },
          { timeout: 60_000 },
        ),
        searchInput.press('Enter'),
      ])
      const r = await request.get(page.url())
      expect(r.ok()).toBeTruthy()
    }
  })

  test('collision query falls back to /search', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const searchInput = page.locator('form[role="search"] input[type="search"]')
    await expect(searchInput).toBeVisible({ timeout: 30_000 })
    await searchInput.fill('1la71134aa60')
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/search', { timeout: 60_000 }),
      searchInput.press('Enter'),
    ])
    expect(new URL(page.url()).searchParams.get('q')).toBe('1la71134aa60')
  })

  test('free-text query navigates to /search with q', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const searchInput = page.locator('form[role="search"] input[type="search"]')
    await expect(searchInput).toBeVisible({ timeout: 30_000 })
    await searchInput.fill('5kW motor')
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/search', { timeout: 60_000 }),
      searchInput.press('Enter'),
    ])
    expect(new URL(page.url()).searchParams.get('q')).toBe('5kW motor')
  })

  test('unknown part navigates to /search', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const searchInput = page.locator('form[role="search"] input[type="search"]')
    await expect(searchInput).toBeVisible({ timeout: 30_000 })
    await searchInput.fill('XYZ-NOT-A-REAL-PART')
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/search', { timeout: 60_000 }),
      searchInput.press('Enter'),
    ])
    expect(new URL(page.url()).searchParams.get('q')).toBe('XYZ-NOT-A-REAL-PART')
  })

  test('empty submit keeps current page and input focus', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const searchForm = page.locator('form[role="search"]')
    const searchInput = searchForm.locator('input[type="search"]')
    await expect(searchInput).toBeVisible({ timeout: 30_000 })
    await searchInput.fill('')
    const before = page.url()
    await searchForm.locator('button[type="submit"]').click()
    await expect(searchInput).toBeFocused()
    expect(page.url()).toBe(before)
  })

  test('hidden product part number must not deep-link to PDP', async ({ page }) => {
    test.skip(!HIDDEN_PART_NUMBER, 'Set E2E_HIDDEN_PART_NUMBER to a hidden product part number')
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const searchInput = page.locator('form[role="search"] input[type="search"]')
    await expect(searchInput).toBeVisible({ timeout: 30_000 })
    await searchInput.fill(HIDDEN_PART_NUMBER)
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/search', { timeout: 60_000 }),
      searchInput.press('Enter'),
    ])
    expect(new URL(page.url()).searchParams.get('q')).toBe(HIDDEN_PART_NUMBER)
  })

  test('unknown /part-number route responds 200 synthetic page', async ({ page }) => {
    const response = await page.goto('/part-number/XYZ-NOT-A-REAL-PART', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await expect(page.locator('form[role="search"] input[type="search"]')).toBeVisible({ timeout: 30_000 })
  })
})
