export const revalidate = 300

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { notFound, permanentRedirect } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Script from 'next/script'
import { getProductByPartNumber, getProductBySlug, getProducts, apiFetch } from '@/lib/api'
import { COMPANY_NAME_EN } from '@/lib/company'
import { API_BASE_URL, normalizeCategoryQueryForApi, SITE_URL } from '@/lib/constants'
import { absoluteUrl, canonicalPath, truncateMetaDescription } from '@/lib/seo'
import { buildBreadcrumbJsonLd, buildProductJsonLd } from '@/lib/productJsonLd'
import { normalizeProductVariants } from '@/lib/productVariants'
import { coerceStockBadges } from '@/lib/productMappers'
import { ProductDetail } from './ProductDetail'
import { SafeImage } from '@/components/ui/SafeImage'
import { ViewProductTracker } from '@/components/analytics/ViewProductTracker'

const RecommendationSections = dynamic(
  () => import('./RecommendationSections').then((m) => m.RecommendationSections),
  {
    loading: () => (
      <div className="mt-10 rounded-xl border border-[--border] bg-[--bg-elevated] p-6">
        <div className="skeleton mb-4 h-6 w-52 rounded-lg" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-40 min-w-[200px] rounded-xl" />
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
)

interface Props {
  params: Promise<{ slug: string }>
}

function looksLikePartNumber(raw: string): boolean {
  const u = decodeURIComponent(raw).toUpperCase().replace(/[\s_-]/g, '')
  return u.length >= 5 && /\d/.test(u)
}

function encodeSlugForUrl(slug: string): string {
  return encodeURIComponent(slug.trim())
}

const loadBySlug = cache(async (slug: string) => {
  try {
    return (await getProductBySlug(slug)) as Record<string, unknown>
  } catch {
    return null
  }
})

const loadByPart = cache(async (pn: string) => {
  try {
    return (await getProductByPartNumber(pn)) as Record<string, unknown>
  } catch {
    return null
  }
})

export async function generateStaticParams() {
  const pageSize = 100
  const maxPages = 50
  const seen = new Set<string>()
  const out: { slug: string }[] = []
  try {
    for (let page = 1; page <= maxPages; page++) {
      const data = (await getProducts({ page, size: pageSize })) as {
        items?: Array<{ slug?: string; part_number?: string }>
        products?: Array<{ slug?: string; part_number?: string }>
      }
      const rows = data.items ?? data.products ?? []
      if (!rows.length) break
      for (const r of rows) {
        const s = (r.slug || r.part_number || '').trim()
        if (!s || seen.has(s)) continue
        seen.add(s)
        out.push({ slug: encodeURIComponent(s) })
      }
      if (rows.length < pageSize) break
    }
    return out
  } catch {
    return []
  }
}

function toSchemaAvailability(availability?: string, stockQty?: number): string {
  const v = (availability || '').toLowerCase()
  if (v === 'in_stock' || v.includes('stock') || v.includes('available')) {
    return 'https://schema.org/InStock'
  }
  if (typeof stockQty === 'number' && stockQty > 0) return 'https://schema.org/InStock'
  if (v.includes('preorder')) return 'https://schema.org/PreOrder'
  if (v.includes('request') || v.includes('order')) return 'https://schema.org/PreOrder'
  return 'https://schema.org/OutOfStock'
}

function parseSpecs(product: Record<string, unknown>): Record<string, string> {
  const raw = product.specifications ?? product.specs
  let obj: Record<string, unknown> = {}
  if (Array.isArray(raw)) {
    // ProductSpec relational rows arrive as [{key, value}, ...]
    for (const row of raw) {
      if (row && typeof row === 'object' && 'key' in row && 'value' in row) {
        const k = String((row as { key: unknown }).key ?? '').trim()
        const v = (row as { value: unknown }).value
        if (k && v != null && String(v).trim()) obj[k] = String(v)
      }
    }
  } else if (raw && typeof raw === 'object') {
    obj = raw as Record<string, unknown>
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) obj = parsed
    } catch {
      /* skip */
    }
  }
  if (Object.keys(obj).length === 0) {
    for (const k of ['voltage', 'current', 'mounting_type', 'protection_rating', 'series']) {
      const v = product[k]
      if (v != null && String(v).trim()) obj[k] = String(v)
    }
  }
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue
    const val =
      typeof v === 'object' && 'value' in (v as Record<string, unknown>)
        ? String((v as Record<string, unknown>).value ?? '')
        : String(v)
    if (val.trim()) {
      result[k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())] = val
    }
  }
  return result
}

function brandDisplayName(product: Record<string, unknown>): string {
  const b = product.brand
  if (typeof b === 'string') return b.trim()
  if (b && typeof b === 'object' && 'name' in (b as Record<string, unknown>)) {
    return String((b as { name?: unknown }).name ?? '').trim()
  }
  return String(product.manufacturer ?? '').trim()
}

/** Prefer canonical `/brands/[slug]` when API exposes a slug; else deep-link search. */
function brandBrowseHref(product: Record<string, unknown>, brandName: string): string {
  if (!brandName.trim()) return '/brands'
  const b = product.brand
  if (b && typeof b === 'object' && b !== null && 'slug' in b) {
    const s = String((b as { slug?: unknown }).slug ?? '').trim()
    if (s) return `/brands/${encodeURIComponent(s)}`
  }
  const slug = typeof product.brand_slug === 'string' ? product.brand_slug.trim() : ''
  if (slug) return `/brands/${encodeURIComponent(slug)}`
  return `/search?q=${encodeURIComponent(brandName)}`
}

function collectGalleryImages(product: Record<string, unknown>): string[] {
  const urls: string[] = []
  const push = (u: string) => {
    const t = u.trim()
    if (t && !urls.includes(t)) urls.push(t)
  }
  push(String(product.image_url ?? '').trim())
  for (const k of ['side_image_url', 'label_image_url', 'box_image_url']) {
    const v = product[k]
    if (typeof v === 'string' && v.trim()) push(v)
  }
  const imgs = product.images
  if (Array.isArray(imgs)) {
    for (const img of imgs) {
      if (typeof img === 'string' && img.trim()) {
        push(img)
        continue
      }
      const row = img as Record<string, unknown>
      const u =
        (typeof row?.url === 'string' && row.url.trim()) ||
        (typeof row?.image_url === 'string' && row.image_url.trim()) ||
        ''
      if (u) push(u)
    }
  }
  return urls
}

/** If detail payload lacks a resolvable gallery, merge canonical ``image_url`` from list search. */
const enrichProductFromCatalogSearch = cache(async (product: Record<string, unknown>) => {
  if (collectGalleryImages(product).length > 0) return product
  const pn = String(product.part_number ?? '').trim()
  if (!pn) return product
  try {
    const qs = new URLSearchParams({
      page: '1',
      size: '1',
      search: pn,
    })
    const res = await apiFetch(`${API_BASE_URL}/api/v1/products/?${qs}`, { next: { revalidate: 120 } })
    if (!res.ok) return product
    const data = (await res.json()) as { items?: Array<Record<string, unknown>> }
    const row = data.items?.[0]
    if (!row) return product
    const out = { ...product }
    const url = String(row.image_url ?? '').trim()
    if (url) out.image_url = url
    return out
  } catch {
    return product
  }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawParam } = await params
  const decoded = decodeURIComponent(rawParam)

  let product: Record<string, unknown> | null = await loadBySlug(decoded)
  let resolvedViaPart = false
  if (!product && looksLikePartNumber(decoded)) {
    product = await loadByPart(decoded)
    resolvedViaPart = Boolean(product)
  }
  if (product) {
    product = await enrichProductFromCatalogSearch(product)
  }

  if (!product) {
    return { title: 'Product not found | Advanced Systems' }
  }

  const canonicalSlug = String(product.slug ?? decoded).trim() || decoded
  const partNum = String(product?.part_number ?? decoded)
  const productName = String(product?.name ?? partNum).trim() || partNum
  const brandName =
    brandDisplayName(product as Record<string, unknown>) || 'Industrial'
  const categoryName =
    typeof product?.category === 'string'
      ? product.category
      : typeof product?.category === 'object' &&
          product?.category &&
          'name' in (product.category as Record<string, unknown>)
        ? String((product.category as { name?: unknown }).name ?? '')
        : ''

  const metaTitleRaw = String(product.meta_title ?? '').trim()
  const metaDescRaw = String(product.meta_description ?? '').trim()
  const rawDesc = String(product?.description || '').trim()
  const fallbackDescSource =
    rawDesc ||
    `${productName} — ${brandName}${categoryName ? ` — ${categoryName}` : ''}. Industrial automation part ${partNum}. Request a quote.`
  const fallbackDescription = truncateMetaDescription(fallbackDescSource, 155)
  const title =
    metaTitleRaw ||
    [productName, brandName || '', categoryName || '']
      .filter((s) => String(s).trim().length > 0)
      .join(' · ')
  const description = metaDescRaw || fallbackDescription
  const canonicalUrl = canonicalPath(`/products/${encodeSlugForUrl(canonicalSlug)}`)

  const ogImageRel = String(product?.image_url || collectGalleryImages(product)[0] || '/placeholder.png')
  const ogImage = absoluteUrl(ogImageRel)

  const displayTitle = title

  return {
    title: displayTitle,
    description,
    keywords: [productName, partNum, brandName, categoryName, 'industrial automation'],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: displayTitle,
      description,
      url: canonicalUrl,
      images: [{ url: ogImage }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  }
}

export default async function ProductSlugPage({ params }: Props) {
  const { slug: rawParam } = await params
  const decoded = decodeURIComponent(rawParam)

  let product: Record<string, unknown> | null = await loadBySlug(decoded)
  let openedViaPartNumber = false
  if (!product && looksLikePartNumber(decoded)) {
    product = await loadByPart(decoded)
    openedViaPartNumber = Boolean(product)
  }
  if (product) {
    product = await enrichProductFromCatalogSearch(product)
  }

  if (!product) return notFound()

  const canonicalSlug = String(product.slug ?? '').trim()
  if (openedViaPartNumber && canonicalSlug && decoded !== canonicalSlug) {
    permanentRedirect(`/products/${encodeSlugForUrl(canonicalSlug)}`)
  }

  const partNum = String(product.part_number ?? decoded)
  const productName = String(product.name ?? partNum).trim() || partNum
  const brandName = brandDisplayName(product as Record<string, unknown>)
  const categoryName =
    typeof product.category === 'string'
      ? product.category
      : typeof product.category === 'object' && product.category && 'name' in product.category
        ? String((product.category as { name?: unknown }).name || '')
        : ''
  const categorySlugForQuery = categoryName ? normalizeCategoryQueryForApi(categoryName) : ''
  const categoryObj =
    product.category && typeof product.category === 'object'
      ? (product.category as { name?: string; slug?: string })
      : null
  const categorySlugFromApi = String(categoryObj?.slug ?? '').trim()
  const categoryBrowsePathSeg = categorySlugFromApi || categorySlugForQuery
  const description = String(product.description || '')
  const series = String(product.series || '')
  const specs = parseSpecs(product)
  const galleryImages = collectGalleryImages(product)
  const datasheetUrl = String(product.datasheet_url ?? product.datasheet ?? '')
  const availability = String(product.availability ?? 'on_request')
  const rawStock = product.stock_quantity
  const stockQty =
    typeof rawStock === 'number' && Number.isFinite(rawStock)
      ? rawStock
      : typeof rawStock === 'string' && /^\d+$/.test(rawStock)
        ? Number(rawStock)
        : 0
  const variants = normalizeProductVariants(product)
  const productUrl = canonicalPath(`/products/${encodeSlugForUrl(canonicalSlug || decoded)}`)
  const keywordSeed = `${productName} ${brandName} ${categoryName} ${series}`.trim()
  const rawPid = product.id
  const productId =
    typeof rawPid === 'number' && Number.isFinite(rawPid)
      ? rawPid
      : typeof rawPid === 'string' && /^\d+$/.test(rawPid)
        ? Number(rawPid)
        : undefined

  const stockBadges = coerceStockBadges(product.stock_badges)

  const schemaImages = (galleryImages.length ? galleryImages : ['/placeholder.png']).map((u) => absoluteUrl(u))
  const schemaDescription =
    (description || `Industrial part ${partNum}${brandName ? ` — ${brandName}` : ''}.`).replace(/\s+/g, ' ').trim()
  const schemaAvailability = toSchemaAvailability(availability, stockQty)

  const productSchema = buildProductJsonLd({
    product,
    variants,
    productUrl,
    productName,
    partNum,
    brandName,
    categoryName,
    schemaImages,
    schemaDescription,
    schemaAvailability,
    companyName: COMPANY_NAME_EN,
    forceCurrency: 'USD',
  })

  const categoryBrowseUrl =
    categoryName && categoryBrowsePathSeg
      ? canonicalPath(`/categories/${encodeURIComponent(categoryBrowsePathSeg)}`)
      : ''

  const brandPathVisual = brandName ? brandBrowseHref(product as Record<string, unknown>, brandName) : ''

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalPath('/') },
    { '@type': 'ListItem', position: 2, name: 'Products', item: canonicalPath('/products') },
  ]
  if (categoryName && categoryBrowseUrl) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: categoryName,
      item: categoryBrowseUrl,
    })
  }
  if (brandName) {
    const brandPath = brandBrowseHref(product as Record<string, unknown>, brandName)
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: brandName,
      item: canonicalPath(brandPath),
    })
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: partNum,
    item: productUrl,
  })

  const breadcrumbSchema = buildBreadcrumbJsonLd({
    items: breadcrumbItems.map((b) => ({ name: b.name, url: String(b.item) })),
  })

  return (
    <div className="relative z-10 min-h-screen">
      <Script
        id="product-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id="product-breadcrumb-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="page-container pb-28 pt-6 sm:pb-28 lg:pb-24 lg:px-8">
        <nav className="mb-6" aria-label="Breadcrumb">
          <p className="sr-only">You are here</p>
          <ol className="flex flex-wrap items-center gap-1 text-xs text-[--text-secondary]">
            <li>
              <Link href="/" className="transition-colors hover:text-[--accent]">
                Home
              </Link>
            </li>
            <li className="flex items-center text-[--text-secondary]/50" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li>
              <Link href="/products" className="transition-colors hover:text-[--accent]">
                Products
              </Link>
            </li>
            {categoryName && categoryBrowsePathSeg ? (
              <>
                <li className="flex items-center text-[--text-secondary]/50" aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li>
                  <Link
                    href={`/categories/${encodeURIComponent(categoryBrowsePathSeg)}`}
                    className="max-w-[200px] truncate transition-colors hover:text-[--accent] sm:max-w-xs"
                    title={categoryName}
                  >
                    {categoryName}
                  </Link>
                </li>
              </>
            ) : null}
            {brandName && brandPathVisual ? (
              <>
                <li className="flex items-center text-[--text-secondary]/50" aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li>
                  <Link
                    href={brandPathVisual}
                    className="max-w-[180px] truncate transition-colors hover:text-[--accent] sm:max-w-xs"
                    title={brandName}
                  >
                    {brandName}
                  </Link>
                </li>
              </>
            ) : null}
            <li className="flex items-center text-[--text-secondary]/50" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="font-mono font-medium text-[--text-primary]" aria-current="page">
              {partNum}
            </li>
          </ol>
        </nav>

        <ViewProductTracker
          partNumber={partNum}
          productId={productId}
          slug={(canonicalSlug || decoded).trim() || null}
        />

        <ProductDetail
          productName={productName}
          partNumber={partNum}
          productId={productId}
          brandName={brandName}
          categoryName={categoryName}
          description={description}
          series={series}
          specs={specs}
          galleryImages={galleryImages}
          datasheetUrl={datasheetUrl}
          availability={availability}
          stockQuantity={stockQty}
          stockBadges={stockBadges}
          pricing={(product as { pricing?: unknown }).pricing as never}
          variants={variants}
          lifecycleStatus={String(product.lifecycle_status ?? 'active')}
        />

        <RecommendationSections
          currentPartNumber={partNum}
          brandName={brandName}
          categoryName={categoryName}
          keywordSeed={keywordSeed}
        />
      </div>
    </div>
  )
}

async function BrandPage({ brandSlug }: { brandSlug: string }) {
  const brand = decodeURIComponent(brandSlug).replace(/\b\w/g, (l) => l.toUpperCase())
  let products: Array<{
    part_number: string
    slug?: string
    manufacturer?: string
    image_url?: string
    description?: string
  }> = []
  let fetchError = false
  try {
    const params = new URLSearchParams({ page: '1', size: '20', sort: 'relevance' })
    params.set('brand', brand)
    const res = await apiFetch(`${API_BASE_URL}/api/v1/search/?${params}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      products = data?.hits ?? data?.items ?? data?.products ?? []
    } else {
      fetchError = true
    }
  } catch {
    fetchError = true
  }

  return (
    <div className="relative z-10 min-h-screen pb-16 pt-8">
      <div className="page-container">
        <nav className="mb-4 text-xs text-[--text-secondary]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[--accent]">
            Home
          </Link>
          <span className="mx-1.5 text-[--text-secondary]/50">/</span>
          <Link href="/products" className="hover:text-[--accent]">
            Products
          </Link>
          <span className="mx-1.5 text-[--text-secondary]/50">/</span>
          <span className="text-[--text-primary]">{brand}</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-[--text-primary] sm:text-3xl">{brand} Industrial Automation Parts</h1>
      </div>
      <div className="page-container mt-8">
        {fetchError ? (
          <p className="py-16 text-center text-red-300">Unable to load products.</p>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-[--border] bg-[--bg-elevated] py-16 text-center text-[--text-secondary]">
            <p className="mb-4 text-lg">
              No products found for <span className="text-[--text-primary]">{brand}</span>.
            </p>
            <Link
              href="/products"
              className="inline-flex rounded-xl bg-[--accent] px-6 py-3 text-sm font-semibold text-white hover:bg-[--accent-hover]"
            >
              Browse all
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => {
              const pathSeg = encodeURIComponent((p.slug || p.part_number).trim())
              return (
                <Link
                  key={p.part_number}
                  href={`/products/${pathSeg}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-[--border] bg-[--bg-elevated] transition-all duration-300 hover:scale-[1.02] hover:border-[--accent]/30"
                >
                  <div className="flex aspect-square items-center justify-center overflow-hidden border-b border-[--border] bg-[--bg-surface] p-3">
                    <SafeImage
                      src={p.image_url}
                      alt={p.part_number}
                      className="max-h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[--text-secondary]">{p.manufacturer || brand}</span>
                    <span className="truncate font-mono text-sm font-bold text-[--accent] transition-colors">
                      {p.part_number}
                    </span>
                    {p.description ? <p className="line-clamp-2 text-xs text-[--text-secondary]">{p.description}</p> : null}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
