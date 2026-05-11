import type { APIRequestContext, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { test } from './fixtures/live-e2e'
import { cleanupTrackedAndTaggedOrphans } from './e2e-cleanup'
import { ensureAdminSession } from './e2e-session'
import { E2E_FAIL, e2eLog, newE2EProductBundle, uniquePartNumber, uniqueProductName } from './e2e-isolation'
import { getApiBaseUrl } from './e2e-target'

const trackedProductIds = new Set<number>()

function tenantId(): string {
  return (process.env.NEXT_PUBLIC_TENANT_ID || 'default').trim() || 'default'
}

async function authHeaders(page: Page): Promise<Record<string, string>> {
  const token = await page.evaluate(() => localStorage.getItem('admin_token'))
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId(),
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function numericId(body: unknown): number {
  const id = body && typeof body === 'object' ? (body as { id?: unknown }).id : undefined
  if (typeof id === 'number' && Number.isFinite(id)) return id
  if (typeof id === 'string' && /^\d+$/.test(id)) return Number(id)
  throw new Error(`${E2E_FAIL.BUG} response did not include numeric id`)
}

async function firstCatalogIds(request: APIRequestContext, headers: Record<string, string>) {
  const base = getApiBaseUrl()
  const brandsRes = await request.get(`${base}/api/v1/brands/`, { headers })
  expect(brandsRes.ok(), `${E2E_FAIL.NETWORK} GET brands ${brandsRes.status()}`).toBeTruthy()
  const brandsJson = await brandsRes.json()
  let brands = Array.isArray(brandsJson) ? brandsJson : (brandsJson as { brands?: unknown[] }).brands ?? []

  const catsRes = await request.get(`${base}/api/v1/categories/`, { headers })
  expect(catsRes.ok(), `${E2E_FAIL.NETWORK} GET categories ${catsRes.status()}`).toBeTruthy()
  const catsJson = await catsRes.json()
  let cats = Array.isArray(catsJson) ? catsJson : (catsJson as { categories?: unknown[] }).categories ?? []

  if (!Number.isFinite(Number((brands[0] as { id?: unknown } | undefined)?.id))) {
    const created = await request.post(`${base}/api/v1/admin/brands`, {
      headers,
      data: { name: `E2E Brand ${Date.now()}`, is_verified: true },
    })
    expect(created.status(), `${E2E_FAIL.DATA_CONFLICT} create fallback brand`).toBe(201)
    brands = [await created.json()]
  }

  if (!Number.isFinite(Number((cats[0] as { id?: unknown } | undefined)?.id))) {
    const created = await request.post(`${base}/api/v1/admin/categories`, {
      headers,
      data: { name: `E2E Category ${Date.now()}` },
    })
    expect(created.status(), `${E2E_FAIL.DATA_CONFLICT} create fallback category`).toBe(201)
    cats = [await created.json()]
  }

  return {
    brand_id: Number((brands[0] as { id?: unknown } | undefined)?.id),
    category_id: Number((cats[0] as { id?: unknown } | undefined)?.id),
  }
}

async function seedVariantFamily(page: Page, request: APIRequestContext, testInfo: Parameters<typeof e2eLog>[0]) {
  const base = getApiBaseUrl()
  const headers = await authHeaders(page)
  expect(headers.Authorization, `${E2E_FAIL.AUTH} Bearer token required for variant fixture`).toBeTruthy()
  const ids = await firstCatalogIds(request, headers)
  expect(Number.isFinite(ids.brand_id), `${E2E_FAIL.DATA_CONFLICT} at least one brand required`).toBeTruthy()
  expect(Number.isFinite(ids.category_id), `${E2E_FAIL.DATA_CONFLICT} at least one category required`).toBeTruthy()

  const bundle = newE2EProductBundle('VARFAM')
  const familyRes = await request.post(`${base}/api/v1/admin/products`, {
    headers,
    data: {
      part_number: bundle.partNumber,
      name: bundle.productName,
      description: 'Playwright variant storefront fixture with two orderable variants.',
      image_url: 'https://placehold.co/600x400/png',
      brand_id: ids.brand_id,
      category_id: ids.category_id,
      is_active: true,
      stock_quantity: 5,
      specs: [],
    },
  })
  expect(familyRes.status(), `${E2E_FAIL.NETWORK} create family product`).toBe(201)
  const family = await familyRes.json()
  const familyId = numericId(family)
  trackedProductIds.add(familyId)
  const slug = String((family as { slug?: unknown }).slug || bundle.partNumber).trim()
  e2eLog(testInfo, `variant fixture family id=${familyId} slug=${slug}`)

  const v1Pn = uniquePartNumber('VARA')
  const v2Pn = uniquePartNumber('VARB')
  const v1 = await request.post(`${base}/api/v1/admin/products/${familyId}/variants`, {
    headers,
    data: { part_number: v1Pn, config: { voltage: '400V' }, price_usd: 101.25 },
  })
  expect(v1.status(), `${E2E_FAIL.NETWORK} create variant A`).toBe(201)
  const v1Body = await v1.json()

  const v2 = await request.post(`${base}/api/v1/admin/products/${familyId}/variants`, {
    headers,
    data: { part_number: v2Pn, config: { voltage: '230V' }, price_usd: 202.5 },
  })
  expect(v2.status(), `${E2E_FAIL.NETWORK} create variant B`).toBe(201)
  const v2Body = await v2.json()

  return {
    familyId,
    slug,
    partNumber: bundle.partNumber,
    variantA: { id: numericId(v1Body), partNumber: v1Pn },
    variantB: { id: numericId(v2Body), partNumber: v2Pn },
    headers,
  }
}

async function seedZeroVariantLegacyProduct(
  page: Page,
  request: APIRequestContext,
  testInfo: Parameters<typeof e2eLog>[0],
) {
  const base = getApiBaseUrl()
  const headers = await authHeaders(page)
  expect(headers.Authorization, `${E2E_FAIL.AUTH} Bearer token required for legacy fixture`).toBeTruthy()
  const ids = await firstCatalogIds(request, headers)
  expect(Number.isFinite(ids.brand_id), `${E2E_FAIL.DATA_CONFLICT} at least one brand required`).toBeTruthy()
  expect(Number.isFinite(ids.category_id), `${E2E_FAIL.DATA_CONFLICT} at least one category required`).toBeTruthy()

  const bundle = newE2EProductBundle('NOVAR')
  const productRes = await request.post(`${base}/api/v1/admin/products`, {
    headers,
    data: {
      part_number: bundle.partNumber,
      name: bundle.productName,
      description: 'Playwright zero-variant legacy product fixture (Spec 028 T002/T007).',
      image_url: 'https://placehold.co/600x400/png',
      brand_id: ids.brand_id,
      category_id: ids.category_id,
      is_active: true,
      stock_quantity: 7,
      specs: [],
    },
  })
  expect(productRes.status(), `${E2E_FAIL.NETWORK} create zero-variant product`).toBe(201)
  const product = await productRes.json()
  const productId = numericId(product)
  trackedProductIds.add(productId)
  const slug = String((product as { slug?: unknown }).slug || bundle.partNumber).trim()
  e2eLog(testInfo, `legacy fixture product id=${productId} slug=${slug}`)
  return { productId, slug, partNumber: bundle.partNumber, headers }
}

test.afterEach(async ({ page, request }, testInfo) => {
  const ids = [...trackedProductIds]
  trackedProductIds.clear()
  const { deleted } = await cleanupTrackedAndTaggedOrphans(page, request, testInfo, ids)
  e2eLog(testInfo, `afterEach: variant cleanup deleted=${deleted}`)
})

test.describe('variant storefront contract (Spec 025/028)', () => {
  test('variant routing and RFQ payloads preserve variant_id', async ({ page, context, request }, testInfo) => {
    await ensureAdminSession(page, context)
    const base = getApiBaseUrl()
    const fx = await seedVariantFamily(page, request, testInfo)

    const familyRedirect = await request.get(`${base}/api/v1/products/slug/${encodeURIComponent(fx.slug)}`, {
      headers: fx.headers,
      maxRedirects: 0,
    })
    expect([301, 302]).toContain(familyRedirect.status())
    expect(familyRedirect.headers().location || '').toContain(`/${fx.variantA.partNumber}`)

    const variantPdp = await request.get(
      `${base}/api/v1/products/slug/${encodeURIComponent(fx.slug)}/${encodeURIComponent(fx.variantA.partNumber)}`,
      { headers: fx.headers },
    )
    expect(variantPdp.status(), `${E2E_FAIL.NETWORK} variant PDP API`).toBe(200)
    const variantBody = await variantPdp.json()
    expect((variantBody as { variants?: unknown[] }).variants?.length).toBe(2)

    const searchRes = await request.get(`${base}/api/v1/search/`, {
      headers: fx.headers,
      params: { q: fx.variantA.partNumber, page: '1', size: '5' },
    })
    expect(searchRes.ok(), `${E2E_FAIL.NETWORK} variant search request`).toBeTruthy()

    await page.goto(`/products/${encodeURIComponent(fx.slug)}`, { waitUntil: 'load' })
    await expect(page.getByLabel('Part number')).toHaveValue(fx.partNumber, {
      timeout: 60_000,
    })

    await expect(page.getByRole('radio').first(), `${E2E_FAIL.UI} variant radio options render`).toBeVisible()
    await expect(page.getByRole('button', { name: /select condition to add to rfq/i })).toBeDisabled()
    await page.getByRole('radio').first().check()

    await expect(page.getByRole('link', { name: /open full rfq form/i })).toHaveAttribute(
      'href',
      new RegExp(`variant_id=${fx.variantA.id}`),
    )

    await page.getByLabel(/work email/i).fill(`variant-${Date.now()}@example.com`)
    await page.getByLabel(/quantity/i).fill('2')
    const rfqPost = page.waitForRequest((req) => {
      if (req.method() !== 'POST' || !req.url().includes('/api/rfq')) return false
      const body = req.postDataJSON() as { variant_id?: number } | null
      return body?.variant_id === fx.variantA.id
    })
    await page.getByRole('button', { name: new RegExp(`submit rfq`, 'i') }).click()
    await rfqPost

    await page.getByRole('link', { name: /open full rfq form/i }).click()
    await expect(page).toHaveURL(new RegExp(`/rfq\\?.*variant_id=${fx.variantA.id}`))

    await request.delete(`${base}/api/v1/admin/products/${fx.familyId}/variants/${fx.variantA.id}`, { headers: fx.headers })
    await request.delete(`${base}/api/v1/admin/products/${fx.familyId}/variants/${fx.variantB.id}`, { headers: fx.headers })

    const deletedVariant = await request.get(
      `${base}/api/v1/products/slug/${encodeURIComponent(fx.slug)}/${encodeURIComponent(fx.variantA.partNumber)}`,
      { headers: fx.headers },
    )
    expect(deletedVariant.status()).toBe(404)

    const zeroLive = await request.get(`${base}/api/v1/products/slug/${encodeURIComponent(fx.slug)}`, {
      headers: fx.headers,
    })
    expect(zeroLive.status()).toBe(200)
    const zeroBody = await zeroLive.json()
    expect((zeroBody as { variants?: unknown[] }).variants).toEqual([])
  })

  test('zero-variant product submits RFQ without variant_id', async ({ page, context, request }, testInfo) => {
    // Spec 028 T002 + T007: a product that was never given variants must accept inline RFQ
    // submission without sending a `variant_id` field, exercising the legacy single-product flow.
    await ensureAdminSession(page, context)
    const fx = await seedZeroVariantLegacyProduct(page, request, testInfo)

    await page.goto(`/products/${encodeURIComponent(fx.slug)}`, { waitUntil: 'load' })
    await expect(page.getByLabel('Part number')).toHaveValue(fx.partNumber, { timeout: 60_000 })

    // No variant selector should render for a zero-variant product.
    await expect(page.getByRole('radio')).toHaveCount(0)

    await page.getByLabel(/work email/i).fill(`legacy-${Date.now()}@example.com`)
    await page.getByLabel(/quantity/i).fill('1')

    const rfqPost = page.waitForRequest((req) => {
      if (req.method() !== 'POST' || !req.url().includes('/api/rfq')) return false
      const body = req.postDataJSON() as { variant_id?: unknown } | null
      return body?.variant_id === undefined || body?.variant_id === null
    })
    await page.getByRole('button', { name: new RegExp(`submit rfq`, 'i') }).click()
    await rfqPost
  })
})
