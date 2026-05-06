/**
 * Spec 010 US1 — exact part-number lookup from global header search.
 */
import { test, expect } from './fixtures/live-e2e'

const VARIANTS = [
  '1LA7113-4AA60',
  '1la7113-4aa60',
  '1LA7113 4AA60',
  '1LA7113_4AA60',
  '1LA7113/4AA60',
  '1la71134aa60',
]
const HIDDEN_PART_NUMBER = (process.env.E2E_HIDDEN_PART_NUMBER || '').trim()

test.describe('Exact part-number lookup (010 US1)', () => {
  test('six header-search variants land on same PDP', async ({ page, request, baseURL }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/products/part/${encodeURIComponent('1LA7113-4AA60')}`)
    test.skip(!probe.ok(), 'Seed publish-ready product 1LA7113-4AA60 (spec 010 quickstart)')

    const payload = (await probe.json()) as { slug?: string }
    const expectedSlug = (payload.slug ?? '').trim()
    test.skip(!expectedSlug, 'Product response missing slug')

    const searchForm = page.locator('form[role="search"]')
    const searchInput = searchForm.locator('input[type="search"]')

    for (const q of VARIANTS) {
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
