/**
 * Spec 009 — sitemap index + child sitemaps + robots (US1).
 * Cron tests live in the same file in US2 (T019); not included in MVP slice T007.
 */
import { test, expect } from './fixtures/live-e2e'

const HIDDEN_PRODUCT_SLUG = (process.env.E2E_SITEMAP_HIDDEN_SLUG || '').trim()
const HIDDEN_BRAND_SLUG = (process.env.E2E_SITEMAP_HIDDEN_BRAND_SLUG || '').trim()

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
})
