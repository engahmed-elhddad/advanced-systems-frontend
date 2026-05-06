/**
 * Spec 006 US2 — canonical PDP redirect behavior contract.
 */
import { test, expect } from './fixtures/live-e2e'

type PartProbe = { slug?: string }

const SEEDED_PART = '1LA7113-4AA60'
const OLD_SLUG_301 = (process.env.E2E_OLD_SLUG_301 || '').trim()
const OLD_SLUG_HIDDEN = (process.env.E2E_OLD_SLUG_HIDDEN || '').trim()

async function resolveCanonicalSlug(request: Parameters<typeof test>[0]['request']): Promise<string> {
  const r = await request.get(`/api/v1/products/part/${encodeURIComponent(SEEDED_PART)}`)
  if (!r.ok()) return ''
  const body = (await r.json()) as PartProbe
  return (body.slug || '').trim()
}

test.describe('Canonical PDP redirects (006 US2)', () => {
  test('case 1 canonical URL returns 200', async ({ page, request }) => {
    const slug = await resolveCanonicalSlug(request)
    test.skip(!slug, `Seed publish-ready product for ${SEEDED_PART}`)

    const response = await page.goto(`/products/${slug}`, { waitUntil: 'commit' })
    expect(response?.status()).toBe(200)
    expect(page.url()).toMatch(new RegExp(`/products/${encodeURIComponent(slug)}$|/products/${slug}$`))
  })

  test('case 2.1 /product/:slug redirects to /products/:slug', async ({ page, request }) => {
    const slug = await resolveCanonicalSlug(request)
    test.skip(!slug, `Seed publish-ready product for ${SEEDED_PART}`)

    const response = await page.goto(`/product/${slug}`, { waitUntil: 'commit' })
    expect(response?.ok() ?? false).toBeTruthy()
    expect(page.url()).toContain(`/products/${slug}`)
  })

  test('case 2.2 /p/:slug redirects to /products/:slug', async ({ page, request }) => {
    const slug = await resolveCanonicalSlug(request)
    test.skip(!slug, `Seed publish-ready product for ${SEEDED_PART}`)

    const response = await page.goto(`/p/${slug}`, { waitUntil: 'commit' })
    expect(response?.ok() ?? false).toBeTruthy()
    expect(page.url()).toContain(`/products/${slug}`)
  })

  test('case 2.3 /part-number/:slug redirects to /products/:slug', async ({ page, request }) => {
    const slug = await resolveCanonicalSlug(request)
    test.skip(!slug, `Seed publish-ready product for ${SEEDED_PART}`)

    const response = await page.goto(`/part-number/${slug}`, { waitUntil: 'commit' })
    expect(response?.ok() ?? false).toBeTruthy()
    expect(page.url()).toContain(`/products/${slug}`)
  })

  test('case 2.4 /en/product/:slug redirects to /products/:slug', async ({ page, request }) => {
    const slug = await resolveCanonicalSlug(request)
    test.skip(!slug, `Seed publish-ready product for ${SEEDED_PART}`)

    const response = await page.goto(`/en/product/${slug}`, { waitUntil: 'commit' })
    expect(response?.ok() ?? false).toBeTruthy()
    expect(page.url()).toContain(`/products/${slug}`)
  })

  test('case 2.5 /ar/product/:slug redirects to /products/:slug', async ({ page, request }) => {
    const slug = await resolveCanonicalSlug(request)
    test.skip(!slug, `Seed publish-ready product for ${SEEDED_PART}`)

    const response = await page.goto(`/ar/product/${slug}`, { waitUntil: 'commit' })
    expect(response?.ok() ?? false).toBeTruthy()
    expect(page.url()).toContain(`/products/${slug}`)
  })

  test('case 3 part-number path redirects to canonical slug path', async ({ page, request }) => {
    const slug = await resolveCanonicalSlug(request)
    test.skip(!slug, `Seed publish-ready product for ${SEEDED_PART}`)

    const response = await page.goto(`/products/${encodeURIComponent(SEEDED_PART)}`, { waitUntil: 'commit' })
    expect(response?.ok() ?? false).toBeTruthy()
    expect(page.url()).toContain(`/products/${slug}`)
  })

  test('case 4 old slug redirects to current slug when product is visible', async ({ page }) => {
    test.skip(!OLD_SLUG_301, 'Set E2E_OLD_SLUG_301 to an old slug that exists in product_slug_history')

    const response = await page.goto(`/products/${OLD_SLUG_301}`, { waitUntil: 'commit' })
    expect(response?.ok() ?? false).toBeTruthy()
    expect(page.url()).not.toContain(`/products/${OLD_SLUG_301}`)
    expect(page.url()).toContain('/products/')
  })

  test('case 5 old slug returns 404 when matching product fails Article 5', async ({ page }) => {
    test.skip(!OLD_SLUG_HIDDEN, 'Set E2E_OLD_SLUG_HIDDEN to old slug of hidden/inactive product')

    const response = await page.goto(`/products/${OLD_SLUG_HIDDEN}`, { waitUntil: 'commit' })
    expect(response?.status()).toBe(404)
  })

  test('case 6 unknown slug returns 404', async ({ page }) => {
    const response = await page.goto('/products/definitely-not-a-product', { waitUntil: 'commit' })
    // In Next.js dev mode, app-router notFound pages can be rendered with 200 transport status.
    // Assert true not-found behavior by status OR by not-found UI.
    const status = response?.status() ?? 0
    const isNotFoundStatus = status === 404
    const notFoundHeading = page.getByRole('heading', { name: /product not found/i })
    if (!isNotFoundStatus) {
      await expect(notFoundHeading).toBeVisible()
    } else {
      expect(status).toBe(404)
    }
  })

  test('case 7 trailing slash redirects to no-slash canonical', async ({ page, request }) => {
    const slug = await resolveCanonicalSlug(request)
    test.skip(!slug, `Seed publish-ready product for ${SEEDED_PART}`)

    const response = await page.goto(`/products/${slug}/`, { waitUntil: 'commit' })
    expect(response?.ok() ?? false).toBeTruthy()
    expect(page.url()).toContain(`/products/${slug}`)
    expect(page.url()).not.toMatch(new RegExp(`/products/${slug}/$`))
  })

  test('case 8 mixed-case slug returns 404', async ({ page, request }) => {
    const slug = await resolveCanonicalSlug(request)
    test.skip(!slug, `Seed publish-ready product for ${SEEDED_PART}`)

    const mixed = slug.replace(/[a-z]/, (m) => m.toUpperCase())
    test.skip(mixed === slug, 'Slug has no lowercase characters to mutate')
    const response = await page.goto(`/products/${mixed}`, { waitUntil: 'commit' })
    expect(response?.status()).toBe(404)
  })
})
