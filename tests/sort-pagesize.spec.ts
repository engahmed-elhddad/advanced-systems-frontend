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

  test('TC_ui_default_01: q=motor without sort/size shows Relevance and 20 per page', async ({
    page,
    baseURL,
    request,
  }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=motor`)
    test.skip(!probe.ok(), 'Search API unavailable')

    await page.goto('/search?q=motor', { waitUntil: 'domcontentloaded' })
    await expect(page).not.toHaveURL(/[?&]sort=/)
    await expect(page).not.toHaveURL(/[?&]size=/)

    const sortTrigger = page.getByLabel('Sort', { exact: true })
    await expect(sortTrigger).toBeVisible({ timeout: 45_000 })
    await expect(sortTrigger).toContainText(/Relevance/i)

    const sizeTrigger = page.getByLabel('Results per page', { exact: true })
    await expect(sizeTrigger).toContainText(/20 per page/i)

    const res = await request.get(`${origin}/api/v1/search/?q=motor`)
    expect(res.ok()).toBeTruthy()
    const data = (await res.json()) as { hits?: unknown[] }
    expect((data.hits ?? []).length).toBeLessThanOrEqual(20)
  })

  test('TC_ui_legacy_01: sort=newest in URL keeps order; toolbar shows URL placeholder', async ({
    page,
    baseURL,
    request,
  }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=motor&sort=newest`)
    test.skip(!probe.ok(), 'Search API unavailable')
    const j = (await probe.json()) as { hits?: { id?: number; created_at?: string | null }[] }
    const hits = j.hits ?? []
    test.skip(hits.length < 2, 'Need ≥2 motor hits for newest ordering check')
    const t0 = hits[0]?.created_at
    const t1 = hits[1]?.created_at
    test.skip(!t0 || !t1, 'Need created_at on hits')
    expect(new Date(String(t0)).getTime()).toBeGreaterThanOrEqual(new Date(String(t1)).getTime()))

    await page.goto('/search?q=motor&sort=newest', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/sort=newest/)
    const sortTrigger = page.getByLabel('Sort', { exact: true })
    await expect(sortTrigger).toBeVisible({ timeout: 45_000 })
    await expect(sortTrigger).toContainText(/from URL/i)
  })

  test('TC_ui_combo_01: three facets + sort + size; reload preserves view', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=motor&facets=true&size=5`)
    test.skip(!probe.ok(), 'Search API unavailable')
    const data = (await probe.json()) as {
      hits?: { brand_id?: number; category_id?: number }[]
      facets?: { name: string; values: { value: unknown; label?: string; count: number }[] }[]
      total?: number
    }
    const h0 = data.hits?.[0]
    const bid = h0?.brand_id
    const cid = h0?.category_id
    test.skip(bid == null || cid == null, 'Need hit with brand_id and category_id')

    const brandFacet = data.facets?.find((f) => f.name === 'brand')
    const catFacet = data.facets?.find((f) => f.name === 'category')
    const condFacet = data.facets?.find((f) => f.name === 'condition')
    const brandLabel = brandFacet?.values?.find((v) => Number(v.value) === bid)?.label
    const catLabel = catFacet?.values?.find((v) => Number(v.value) === cid)?.label
    const newRow = condFacet?.values?.find((v) => String(v.value) === 'new' && v.count > 0)
    test.skip(!brandLabel || !catLabel || !newRow, 'Need facet labels for brand, category, and New')

    await page.goto('/search?q=motor', { waitUntil: 'domcontentloaded' })
    await page.getByRole('checkbox', { name: new RegExp(escapeRe(brandLabel), 'i') }).click()
    await page.getByRole('checkbox', { name: new RegExp(escapeRe(catLabel), 'i') }).click()
    await page.getByRole('checkbox', { name: /^New\b/i }).click()

    await page.getByLabel('Sort', { exact: true }).click()
    await page.getByRole('option', { name: /Price: low to high/i }).click()
    await page.getByLabel('Results per page', { exact: true }).click()
    await page.getByRole('option', { name: /^50 per page/ }).click()

    await expect(page).toHaveURL(new RegExp(`[?&]brand_id=${bid}`))
    await expect(page).toHaveURL(new RegExp(`[?&]category_id=${cid}`))
    await expect(page).toHaveURL(/[?&]condition=new/)
    await expect(page).toHaveURL(/[?&]sort=price_asc/)
    await expect(page).toHaveURL(/[?&]size=50/)

    const url = page.url()
    const before = await request.get(`${origin}/api/v1/search/?${new URL(url).searchParams.toString()}`)
    expect(before.ok()).toBeTruthy()
    const totalBefore = ((await before.json()) as { total?: number }).total

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(new RegExp(`[?&]brand_id=${bid}`))
    await expect(page).toHaveURL(/[?&]sort=price_asc/)
    const after = await request.get(`${origin}/api/v1/search/?${new URL(page.url()).searchParams.toString()}`)
    expect(after.ok()).toBeTruthy()
    const totalAfter = ((await after.json()) as { total?: number }).total
    expect(totalAfter).toBe(totalBefore)
  })
})

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

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
