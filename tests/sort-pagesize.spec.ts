/**
 * Spec 014 — sort + page-size toolbar (live E2E; skips when search unavailable).
 */
import { test, expect } from './fixtures/live-e2e'

const SORT_CYCLE = ['price_asc', 'price_desc', 'brand_az', 'partnumber_az', 'relevance'] as const

test.describe('Sort and page size (014)', () => {
  test('TC_ui_sort_01: each sort option updates URL', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=motor&facets=true`)
    test.skip(!probe.ok(), 'Search API unavailable')

    await page.goto('/search?q=motor', { waitUntil: 'domcontentloaded' })
    const sortTrigger = page.getByLabel('Sort', { exact: true })
    await expect(sortTrigger).toBeVisible({ timeout: 45_000 })

    for (const v of SORT_CYCLE) {
      await sortTrigger.click()
      await page.getByRole('option', { name: new RegExp(SORT_LABEL_PATTERN(v)) }).click()
      if (v === 'relevance') {
        await expect(page).not.toHaveURL(/[?&]sort=/)
      } else {
        await expect(page).toHaveURL(new RegExp(`[?&]sort=${v}`))
      }
    }
  })

  test('TC_ui_sort_02: Price low to high — API hits non-decreasing by price_usd', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=motor`)
    test.skip(!probe.ok(), 'Search API unavailable')

    await page.goto('/search?q=motor', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Sort', { exact: true }).click()
    await page.getByRole('option', { name: /Price: low to high/i }).click()
    await expect(page).toHaveURL(/sort=price_asc/)

    const u = new URL(page.url())
    const res = await request.get(`${origin}/api/v1/search/?${u.searchParams.toString()}`)
    expect(res.ok()).toBeTruthy()
    const data = (await res.json()) as { hits?: { price_usd?: number | null }[] }
    const nums = (data.hits ?? [])
      .map((h) => h.price_usd)
      .filter((x): x is number => typeof x === 'number' && !Number.isNaN(x))
    test.skip(nums.length < 2, 'Need ≥2 numeric prices in motor results')
    for (let i = 1; i < nums.length; i++) {
      expect(nums[i - 1]).toBeLessThanOrEqual(nums[i])
    }
  })

  test('TC_ui_sort_03: page 2 then sort change drops page param', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=motor&size=10`)
    test.skip(!probe.ok(), 'Search API unavailable')
    const j = (await probe.json()) as { pages?: number }
    test.skip((j.pages ?? 1) < 2, 'Need ≥2 pages for motor at size=10')

    await page.goto('/search?q=motor&size=10&page=2', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/page=2/)

    await page.getByLabel('Sort', { exact: true }).click()
    await page.getByRole('option', { name: /Price: high to low/i }).click()
    await expect(page).toHaveURL(/sort=price_desc/)
    await expect(page).not.toHaveURL(/page=2/)
  })

  test('TC_ui_size_01: each page size updates URL', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=motor`)
    test.skip(!probe.ok(), 'Search API unavailable')

    await page.goto('/search?q=motor', { waitUntil: 'domcontentloaded' })
    const sizeTrigger = page.getByLabel('Results per page', { exact: true })
    await expect(sizeTrigger).toBeVisible({ timeout: 45_000 })

    for (const n of [10, 50, 100] as const) {
      await sizeTrigger.click()
      await page.getByRole('option', { name: new RegExp(`^${n} per page`) }).click()
      await expect(page).toHaveURL(new RegExp(`[?&]size=${n}`))
    }
    await sizeTrigger.click()
    await page.getByRole('option', { name: /^20 per page/ }).click()
    await expect(page).not.toHaveURL(/size=20/)
  })

  test('TC_ui_size_02: from page 5 changing size resets to page 1', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=motor&size=20`)
    test.skip(!probe.ok(), 'Search API unavailable')
    const j = (await probe.json()) as { pages?: number }
    test.skip((j.pages ?? 1) < 5, 'Need ≥5 pages for motor at size=20')

    await page.goto('/search?q=motor&size=20&page=5', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/page=5/)

    await page.getByLabel('Results per page', { exact: true }).click()
    await page.getByRole('option', { name: /^100 per page/ }).click()
    await expect(page).toHaveURL(/size=100/)
    await expect(page).not.toHaveURL(/page=5/)
  })
})

function SORT_LABEL_PATTERN(v: (typeof SORT_CYCLE)[number]): string {
  switch (v) {
    case 'relevance':
      return '^Relevance'
    case 'price_asc':
      return 'Price: low to high'
    case 'price_desc':
      return 'Price: high to low'
    case 'brand_az':
      return 'Brand A'
    case 'partnumber_az':
      return 'Part Number'
    default:
      return ''
  }
}
