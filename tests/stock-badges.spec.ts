/**
 * Spec 017 — Stock badges on PDP (live API).
 */
import { test, expect } from './fixtures/live-e2e'

const PDP_SLUG = (process.env.E2E_PDP_SLUG || '7ml5221-1ca11').trim()

test.describe('Stock badges (017)', () => {
  test('PDP renders stock badge list from API', async ({ page }) => {
    await page.goto(`/products/${encodeURIComponent(PDP_SLUG)}`, { waitUntil: 'domcontentloaded' })

    const list = page.getByTestId('stock-badge-list')
    await expect(list).toBeVisible()

    const badges = list.locator('[class*="rounded-full"]')
    await expect(badges.first()).toBeVisible()

    const combined = (await list.innerText()).trim()
    expect(combined.length).toBeGreaterThan(0)
    expect(combined).toMatch(/In Stock|Stock|day|Indent|متوفر|تحت الطلب|٧|١٤/i)
  })

  test('Arabic cookie shows Arabic lead-time / indent label when applicable', async ({ context, page }) => {
    test.skip(
      !process.env.E2E_AR_COOKIE,
      'Set E2E_AR_COOKIE=1 for localhost runs (cookie domain is fixed to localhost).'
    )
    await context.addCookies([
      {
        name: 'locale',
        value: 'ar',
        path: '/',
        domain: 'localhost',
      },
    ])
    await page.goto(`/products/${encodeURIComponent(PDP_SLUG)}`, { waitUntil: 'domcontentloaded' })
    const list = page.getByTestId('stock-badge-list')
    await expect(list).toBeVisible()
    const text = (await list.innerText()).trim()
    expect(text.length).toBeGreaterThan(0)
    expect(text).toMatch(/متوفر|تحت الطلب|٧|١٤/)
  })
})
