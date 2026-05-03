/**
 * Spec 012 — faceted search sidebar (live E2E; skips when API/search unavailable).
 */
import type { APIRequestContext } from '@playwright/test'
import { test, expect } from './fixtures/live-e2e'

type FacetValue = { value: string | number; label: string; count: number }
type Facet = { name: string; values: FacetValue[] }

async function fetchMotorFacets(origin: string, request: APIRequestContext) {
  const probe = await request.get(`${origin}/api/v1/search/?q=motor&facets=true`)
  if (!probe.ok()) return null
  const data = (await probe.json()) as { facets?: Facet[] }
  return data.facets ?? []
}

test.describe('Faceted search (012 US1)', () => {
  test('TC1: /search?q=motor shows at least one spec-012 facet section', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=motor&facets=true`)
    test.skip(!probe.ok(), 'GET /api/v1/search with facets unavailable')

    await page.goto('/search?q=motor', { waitUntil: 'domcontentloaded' })
    const facetMarker = page
      .getByText('Stock Status', { exact: true })
      .or(page.getByText('Condition', { exact: true }))
      .or(page.getByText('Price Band', { exact: true }))
    await expect(facetMarker.first()).toBeVisible({ timeout: 45_000 })
  })

  test('TC8: impossible filters show empty state with recovery affordance', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=___nomatch___xyz123&facets=true`)
    test.skip(!probe.ok(), 'Search API unavailable')

    await page.goto('/search?q=___nomatch___xyz123', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/No products match your search/i)).toBeVisible({ timeout: 45_000 })
    await expect(page.getByRole('button', { name: /Reset all/i })).toBeVisible()
  })
})

test.describe('Faceted search (012 US2)', () => {
  test('TC2: two brand selections → URL has two brand_id params', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const facets = await fetchMotorFacets(origin, request)
    test.skip(!facets?.length, 'Search API with facets unavailable')

    const brandFacet = facets.find((f) => f.name === 'brand')
    const withCount = (brandFacet?.values ?? []).filter((v) => v.count > 0)
    test.skip(withCount.length < 2, 'Need ≥2 brands with hits for motor query')

    const [b0, b1] = withCount
    await page.goto('/search?q=motor', { waitUntil: 'domcontentloaded' })
    await page.locator('aside label').filter({ hasText: b0.label }).first().locator('input[type="checkbox"]').check()
    await page.locator('aside label').filter({ hasText: b1.label }).first().locator('input[type="checkbox"]').check()

    await expect(page).toHaveURL(/brand_id=/)
    const u = new URL(page.url())
    const bids = u.searchParams.getAll('brand_id')
    expect(bids.length).toBe(2)
    expect(new Set(bids)).toEqual(
      new Set([String(b0.value), String(b1.value)]),
    )
  })

  test('TC3: brand + category + condition narrow URL (AND-across)', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const facets = await fetchMotorFacets(origin, request)
    test.skip(!facets?.length, 'Search API with facets unavailable')

    const brandFacet = facets.find((f) => f.name === 'brand')
    const catFacet = facets.find((f) => f.name === 'category')
    const condFacet = facets.find((f) => f.name === 'condition')
    const b = (brandFacet?.values ?? []).find((v) => v.count > 0)
    const c = (catFacet?.values ?? []).find((v) => v.count > 0)
    const cond = (condFacet?.values ?? []).find((v) => v.count > 0 && v.value !== 'unknown')
    test.skip(!b || !c || !cond, 'Need brand, category, and condition with hits')

    await page.goto('/search?q=motor', { waitUntil: 'domcontentloaded' })
    await page.locator('aside label').filter({ hasText: b.label }).first().locator('input[type="checkbox"]').check()
    await page.locator('aside label').filter({ hasText: c.label }).first().locator('input[type="checkbox"]').check()
    await page.locator('aside label').filter({ hasText: cond.label }).first().locator('input[type="checkbox"]').check()

    await expect(page).toHaveURL(/brand_id=/)
    await expect(page).toHaveURL(/category_id=/)
    await expect(page).toHaveURL(/condition=/)
    const u = new URL(page.url())
    expect(u.searchParams.getAll('brand_id')).toContain(String(b.value))
    expect(u.searchParams.getAll('category_id')).toContain(String(c.value))
    expect(u.searchParams.getAll('condition')).toContain(String(cond.value))
  })

  test('TC6: price band rows show USD and EGP when FX present', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=motor&facets=true`)
    test.skip(!probe.ok(), 'GET /api/v1/search with facets unavailable')
    const data = (await probe.json()) as { facets?: Facet[] }
    const pb = data.facets?.find((f) => f.name === 'price_band')
    const hasEgp = (pb?.values as { label_egp?: string }[] | undefined)?.some((v) => !!v.label_egp)
    test.skip(!hasEgp, 'No EGP labels in API response (FX cache empty) — skip TC6')

    await page.goto('/search?q=motor', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('aside').getByText('E£', { exact: false }).first()).toBeVisible({
      timeout: 45_000,
    })
  })

  test('TC7: no label_egp → info tooltip path (routed JSON)', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const probe = await request.get(`${origin}/api/v1/search/?q=motor&facets=true`)
    test.skip(!probe.ok(), 'Search API unavailable')

    await page.route('**/api/v1/search**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }
      const res = await route.fetch()
      const body = (await res.json()) as { facets?: { name: string; values: Record<string, unknown>[] }[] }
      const f = body.facets?.find((x) => x.name === 'price_band')
      if (f?.values) {
        for (const row of f.values) {
          delete row.label_egp
        }
      }
      await route.fulfill({ status: res.status(), json: body })
    })

    await page.goto('/search?q=motor', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('aside').getByTitle('EGP unavailable — refresh shortly')).toBeVisible({
      timeout: 45_000,
    })
  })

  test('TC9: toggling selected condition removes it from URL', async ({ page, baseURL, request }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '')
    const facets = await fetchMotorFacets(origin, request)
    test.skip(!facets?.length, 'Search API with facets unavailable')

    const condFacet = facets.find((f) => f.name === 'condition')
    const cond = (condFacet?.values ?? []).find((v) => v.count > 0 && v.value !== 'unknown')
    test.skip(!cond, 'No condition facet with hits')

    await page.goto(`/search?q=motor&condition=${encodeURIComponent(String(cond.value))}`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL(/condition=/)

    await page.locator('aside label').filter({ hasText: cond.label }).first().locator('input[type="checkbox"]').click()
    await expect(page).not.toHaveURL(new RegExp(`condition=${String(cond.value)}`))
  })
})
