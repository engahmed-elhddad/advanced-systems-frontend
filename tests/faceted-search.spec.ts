/**
 * Spec 012 US1 — faceted search sidebar (live E2E; skips when API/search unavailable).
 */
import { test, expect } from './fixtures/live-e2e'

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
