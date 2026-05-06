/**
 * Spec 009 — sitemap index + child sitemaps + robots (US1).
 * Cron tests live in the same file in US2 (T019); not included in MVP slice T007.
 */
import { test, expect } from './fixtures/live-e2e'

const HIDDEN_PRODUCT_SLUG = (process.env.E2E_SITEMAP_HIDDEN_SLUG || '').trim()
const HIDDEN_BRAND_SLUG = (process.env.E2E_SITEMAP_HIDDEN_BRAND_SLUG || '').trim()
const CRON_SECRET = (process.env.E2E_CRON_SECRET || process.env.CRON_SECRET || '').trim()

test.describe('Sitemap pipeline (009)', () => {
  test('sitemap.xml is index with three child sitemaps', async ({ page }) => {
    const res = await page.goto('/sitemap.xml', { waitUntil: 'domcontentloaded' })
    expect(res?.ok() ?? false).toBeTruthy()
    const body = (await page.content()) ?? ''
    expect(body).toContain('sitemapindex')
    expect(body).toMatch(/sitemap-products\.xml/)
    expect(body).toMatch(/sitemap-brands\.xml/)
    expect(body).toMatch(/sitemap-categories\.xml/)
  })

  test('child sitemaps return urlset', async ({ page }) => {
    for (const path of ['/sitemap-products.xml', '/sitemap-brands.xml', '/sitemap-categories.xml']) {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(res?.ok() ?? false).toBeTruthy()
      const body = (await page.content()) ?? ''
      expect(body).toContain('urlset')
    }
  })

  test('hidden product slug not in sitemap-products.xml', async ({ page }) => {
    test.skip(!HIDDEN_PRODUCT_SLUG, 'Set E2E_SITEMAP_HIDDEN_SLUG to a non–publish-ready product slug')
    await page.goto('/sitemap-products.xml', { waitUntil: 'domcontentloaded' })
    const body = (await page.content()) ?? ''
    expect(body).not.toContain(`>${HIDDEN_PRODUCT_SLUG}<`)
    expect(body).not.toContain(`/${encodeURIComponent(HIDDEN_PRODUCT_SLUG)}<`)
  })

  test('all-hidden brand slug not in sitemap-brands.xml', async ({ page }) => {
    test.skip(!HIDDEN_BRAND_SLUG, 'Set E2E_SITEMAP_HIDDEN_BRAND_SLUG to a brand slug with no publish-ready products')
    await page.goto('/sitemap-brands.xml', { waitUntil: 'domcontentloaded' })
    const body = (await page.content()) ?? ''
    expect(body).not.toContain(`/brands/${encodeURIComponent(HIDDEN_BRAND_SLUG)}`)
  })

  test('robots.txt lists sitemap index and three children', async ({ page }) => {
    await page.goto('/robots.txt', { waitUntil: 'domcontentloaded' })
    const body = (await page.content()) ?? ''
    expect(body).toContain('sitemap.xml')
    expect(body).toContain('sitemap-products.xml')
    expect(body).toContain('sitemap-brands.xml')
    expect(body).toContain('sitemap-categories.xml')
  })

  test('cron endpoint rejects requests without authorization', async ({ page }) => {
    const res = await page.request.get('/api/cron/sitemap-refresh')
    expect(res.status()).toBe(401)
    const body = (await res.json()) as { error?: string }
    expect(body.error).toBe('unauthorized')
  })

  test('cron endpoint returns summary JSON with valid authorization', async ({ page }) => {
    test.skip(!CRON_SECRET, 'Set E2E_CRON_SECRET or CRON_SECRET to run cron e2e assertions')
    const headers = { Authorization: `Bearer ${CRON_SECRET}` }
    const res = await page.request.get('/api/cron/sitemap-refresh', { headers })
    expect(res.status()).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.status).toBeTruthy()
    expect(body).toHaveProperty('products_count')
    expect(body).toHaveProperty('brands_count')
    expect(body).toHaveProperty('categories_count')
    expect(body).toHaveProperty('duration_seconds')
    expect(body).toHaveProperty('delta_anomaly')
    expect(body).toHaveProperty('count_warning')
  })

  test('cron endpoint is idempotent and creates distinct runs', async ({ page }) => {
    test.skip(!CRON_SECRET, 'Set E2E_CRON_SECRET or CRON_SECRET to run cron e2e assertions')
    const headers = { Authorization: `Bearer ${CRON_SECRET}` }
    const first = await page.request.get('/api/cron/sitemap-refresh', { headers })
    const second = await page.request.get('/api/cron/sitemap-refresh', { headers })
    expect(first.status()).toBe(200)
    expect(second.status()).toBe(200)
    const firstBody = (await first.json()) as Record<string, unknown>
    const secondBody = (await second.json()) as Record<string, unknown>
    expect(firstBody.status).toBeTruthy()
    expect(secondBody.status).toBeTruthy()
  })
})
