/**
 * Spec 008 — PDP Trust Block + /policies/rma + Footer link (research D6).
 * Lives under `tests/` to match `playwright.e2e.config.ts` testDir.
 */
import { test, expect } from './fixtures/live-e2e'

const PDP_SLUG = (process.env.E2E_PDP_SLUG || '7ml5221-1ca11').trim()

test.describe('PDP trust block (008)', () => {
  test('PDP renders Trust Block, contact links, ISO hidden by default', async ({ page }) => {
    await page.goto(`/products/${encodeURIComponent(PDP_SLUG)}`, { waitUntil: 'domcontentloaded' })

    const block = page.getByTestId('trust-block')
    await expect(block).toBeVisible()

    await expect(block.getByText('12 months warranty')).toBeVisible()
    await expect(block.getByText('30-day return policy')).toBeVisible()

    await expect(block.getByText('Registered business in Egypt')).toBeVisible()
    await expect(block.getByText('Tax ID available upon request')).toBeVisible()

    const wa = block.getByRole('link', { name: /WhatsApp/i }).first()
    await expect(wa).toBeVisible()
    const waHref = (await wa.getAttribute('href')) ?? ''
    expect(waHref).toMatch(/^https:\/\/wa\.me\/\d+\?text=/)
    expect(waHref).toMatch(/Inquiry%20about%20/)

    const mail = block.getByRole('link', { name: /Email/i }).first()
    await expect(mail).toBeVisible()
    expect((await mail.getAttribute('href')) ?? '').toMatch(/^mailto:/)

    const telLinks = block.locator('a[href^="tel:"]')
    if ((await telLinks.count()) > 0) {
      await expect(telLinks.first()).toBeVisible()
    }

    await expect(block.getByText('Certified')).toHaveCount(0)
  })

  test('RMA badge navigates to /policies/rma', async ({ page }) => {
    await page.goto(`/products/${encodeURIComponent(PDP_SLUG)}`, { waitUntil: 'domcontentloaded' })
    await page.getByTestId('trust-block').getByRole('link', { name: /30-day return policy/i }).click()
    await expect(page).toHaveURL(/\/policies\/rma/)
    await expect(page.getByRole('heading', { name: /Return & RMA Policy/i, level: 1 })).toBeVisible()
  })

  test('policy page direct: 200, heading, canonical', async ({ page }) => {
    const res = await page.goto('/policies/rma', { waitUntil: 'domcontentloaded' })
    expect(res?.ok() ?? false).toBeTruthy()
    await expect(page.getByRole('heading', { name: /Return & RMA Policy/i, level: 1 })).toBeVisible()

    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveCount(1)
    const href = await canonical.getAttribute('href')
    expect(href ?? '').toMatch(/\/policies\/rma$/)
  })

  test('footer has RMA Policy link to /policies/rma', async ({ page }) => {
    await page.goto('/about', { waitUntil: 'domcontentloaded' })
    const link = page.getByRole('contentinfo').getByRole('link', { name: 'RMA Policy' })
    await expect(link.first()).toBeVisible()
    await link.first().click()
    await expect(page).toHaveURL(/\/policies\/rma/)
  })
})
