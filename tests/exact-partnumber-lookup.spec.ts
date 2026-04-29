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
})
