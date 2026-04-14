import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Script from 'next/script'
import { getProductByPartNumber, getProductBySlug, getProducts, apiFetch } from '@/lib/api'
import { COMPANY_NAME_EN } from '@/lib/company'
import { normalizeCategoryQueryForApi, SITE_URL } from '@/lib/constants'
import { canonicalPath } from '@/lib/seo'
import { normalizeProductVariants } from '@/lib/productVariants'
import { ProductDetail } from './ProductDetail'
import { ProductPageSearchStrip } from './ProductPageSearchStrip'
import { SafeImage } from '@/components/ui/SafeImage'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

const RecommendationSections = dynamic(
  () => import('./RecommendationSections').then((m) => m.RecommendationSections),
  {
    loading: () => (
      <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
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
  try {
    const data = (await getProducts({ page: 1, size: 500 })) as {
      items?: Array<{ slug?: string; part_number?: string }>
      products?: Array<{ slug?: string; part_number?: string }>
    }
    const rows = data.items ?? data.products ?? []
    return rows
      .map((r) => (r.slug || r.part_number || '').trim())
      .filter(Boolean)
      .map((s) => ({ slug: encodeURIComponent(s) }))
  } catch {
    return []
  }
}

function toSchemaAvailability(availability?: string): string {
  const v = (availability || '').toLowerCase()
  if (v.includes('stock') || v.includes('available')) return 'https://schema.org/InStock'
  if (v.includes('preorder')) return 'https://schema.org/PreOrder'
  return 'https://schema.org/OutOfStock'
}

function parseSpecs(product: Record<string, unknown>): Record<string, string> {
  const raw = product.specifications ?? product.specs
  let obj: Record<string, unknown> = {}
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
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

function collectGalleryImages(product: Record<string, unknown>): string[] {
  const urls: string[] = []
  const main = String(product.image_url ?? '')
  if (main) urls.push(main)
  for (const k of ['main_image_url', 'side_image_url', 'label_image_url', 'box_image_url']) {
    const v = product[k]
    if (typeof v === 'string' && v && !urls.includes(v)) urls.push(v)
  }
  const imgs = product.images
  if (Array.isArray(imgs)) {
    for (const img of imgs) {
      const u = typeof img === 'string' ? img : (img as Record<string, unknown>)?.url
      if (typeof u === 'string' && u && !urls.includes(u)) urls.push(u)
    }
  }
  return urls
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawParam } = await params
  const decoded = decodeURIComponent(rawParam)

  let product: Record<string, unknown> | null = await loadBySlug(decoded)
  let resolvedViaPart = false
  if (!product) {
    product = await loadByPart(decoded)
    resolvedViaPart = Boolean(product)
  }

  if (!product && !looksLikePartNumber(decoded)) {
    const brand = decoded.replace(/\b\w/g, (l) => l.toUpperCase())
    return {
      title: `${brand} Industrial Automation Parts | Advanced Systems`,
      description: `${brand} PLCs, drives, sensors, and spare parts. Request a quote — fast response.`,
      alternates: { canonical: canonicalPath(`/products/${encodeSlugForUrl(decoded)}`) },
    }
  }

  if (!product) {
    return { title: 'Product | Advanced Systems' }
  }

  const canonicalSlug = String(product.slug ?? decoded).trim() || decoded
  const partNum = String(product?.part_number ?? decoded)
  const productName = String(product?.name ?? partNum).trim() || partNum
  const brandName = String(product?.brand ?? product?.manufacturer ?? 'Industrial')
  const categoryName =
    typeof product?.category === 'string'
      ? product.category
      : typeof product?.category === 'object' &&
          product?.category &&
          'name' in (product.category as Record<string, unknown>)
        ? String((product.category as { name?: unknown }).name ?? '')
        : 'Industrial Parts'

  const metaTitleRaw = String(product.meta_title ?? '').trim()
  const metaDescRaw = String(product.meta_description ?? '').trim()
  const rawDesc = String(product?.description || `${productName} (${partNum}) — ${brandName}.`).trim()
  const trimmed = rawDesc.length > 110 ? `${rawDesc.slice(0, 110).trim()}…` : rawDesc
  const fallbackDescription = `${trimmed} Request a quote — typical reply 2–6 hours.`.slice(0, 160)
  const title =
    metaTitleRaw ||
    `${productName} | ${brandName} | ${categoryName}`
  const description = metaDescRaw || fallbackDescription
  const canonicalUrl = canonicalPath(`/products/${encodeSlugForUrl(canonicalSlug)}`)

  const ogImage = String(product?.image_url || collectGalleryImages(product)[0] || '/placeholder.png')

  return {
    title,
    description,
    keywords: [productName, partNum, brandName, categoryName, 'industrial automation'],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: metaTitleRaw || `${productName} | ${brandName}`,
      description,
      url: canonicalUrl,
      images: [ogImage],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitleRaw || `${productName} | ${brandName}`,
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
  if (!product) {
    product = await loadByPart(decoded)
    openedViaPartNumber = Boolean(product)
  }

  if (!product && !looksLikePartNumber(decoded)) {
    return <BrandPage brandSlug={decoded} />
  }
  if (!product) return notFound()

  const canonicalSlug = String(product.slug ?? '').trim()
  if (openedViaPartNumber && canonicalSlug && decoded !== canonicalSlug) {
    permanentRedirect(`/products/${encodeSlugForUrl(canonicalSlug)}`)
  }

  const partNum = String(product.part_number ?? decoded)
  const productName = String(product.name ?? partNum).trim() || partNum
  const brandName = String(product.brand ?? product.manufacturer ?? '').trim()
  const categoryName =
    typeof product.category === 'string'
      ? product.category
      : typeof product.category === 'object' && product.category && 'name' in product.category
        ? String((product.category as { name?: unknown }).name || '')
        : ''
  const categorySlugForQuery = categoryName ? normalizeCategoryQueryForApi(categoryName) : ''
  const description = String(product.description || '')
  const series = String(product.series || '')
  const specs = parseSpecs(product)
  const galleryImages = collectGalleryImages(product)
  const datasheetUrl = String(product.datasheet_url ?? product.datasheet ?? '')
  const availability = String(product.availability ?? 'on_request')
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

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    image: galleryImages.length ? galleryImages : [`${SITE_URL}/placeholder.png`],
    description: description || `Buy ${productName} with fast delivery.`,
    sku: partNum,
    mpn: partNum,
    category: categoryName || 'Industrial Parts',
    brand: {
      '@type': 'Brand',
      name: brandName || 'Industrial',
    },
    url: productUrl,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      availability: toSchemaAvailability(availability),
      seller: { '@type': 'Organization', name: COMPANY_NAME_EN },
      ...(typeof product.price_usd === 'number' ? { price: product.price_usd, priceCurrency: 'USD' } : {}),
    },
  }

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalPath('/') },
    { '@type': 'ListItem', position: 2, name: 'Products', item: canonicalPath('/products') },
  ]
  if (categoryName && categorySlugForQuery) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: categoryName,
      item: `${canonicalPath('/products')}?category=${encodeURIComponent(categorySlugForQuery)}`,
    })
  }
  if (brandName) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: brandName,
      item: `${canonicalPath('/products')}?brand=${encodeURIComponent(brandName)}`,
    })
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: partNum,
    item: productUrl,
  })

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

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

      <div
        className="pointer-events-none absolute left-1/2 top-32 -z-10 h-[min(80vw,480px)] w-[min(80vw,480px)] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-40 -z-10 h-[min(70vw,400px)] w-[min(70vw,400px)] rounded-full bg-orange-500/18 blur-[120px]"
        aria-hidden
      />

      <div className="page-container pb-20 pt-6 sm:pb-24 lg:px-8">
        <nav className="mb-6 text-xs text-white/50" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-orange-300">
                Home
              </Link>
            </li>
            <li className="text-white/25">/</li>
            <li>
              <Link href="/products" className="transition-colors hover:text-orange-300">
                Products
              </Link>
            </li>
            {categoryName && categorySlugForQuery ? (
              <>
                <li className="text-white/25">/</li>
                <li>
                  <Link
                    href={`/products?category=${encodeURIComponent(categorySlugForQuery)}`}
                    className="transition-colors hover:text-orange-300"
                  >
                    {categoryName}
                  </Link>
                </li>
              </>
            ) : null}
            {brandName ? (
              <>
                <li className="text-white/25">/</li>
                <li>
                  <Link
                    href={`/products?brand=${encodeURIComponent(brandName)}`}
                    className="transition-colors hover:text-orange-300"
                  >
                    {brandName}
                  </Link>
                </li>
              </>
            ) : null}
            <li className="text-white/25">/</li>
            <li className="font-mono font-medium text-white/90">{partNum}</li>
          </ol>
        </nav>

        <ProductPageSearchStrip className="mb-10" />

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
          variants={variants}
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
    const res = await apiFetch(`${API_BASE}/api/v1/search/?${params}`, { cache: 'no-store' })
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
        <nav className="mb-4 text-xs text-white/50" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-orange-300">
            Home
          </Link>
          <span className="mx-1.5 text-white/25">/</span>
          <Link href="/products" className="hover:text-orange-300">
            Products
          </Link>
          <span className="mx-1.5 text-white/25">/</span>
          <span className="text-white">{brand}</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{brand} Industrial Automation Parts</h1>
      </div>
      <div className="page-container mt-8">
        {fetchError ? (
          <p className="py-16 text-center text-red-300">Unable to load products.</p>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 py-16 text-center text-white/60 backdrop-blur-xl">
            <p className="mb-4 text-lg">
              No products found for <span className="text-white">{brand}</span>.
            </p>
            <Link
              href="/products"
              className="inline-flex rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/30"
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
                  className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/[0.14] hover:shadow-lg hover:shadow-orange-500/10"
                >
                  <div className="flex aspect-square items-center justify-center overflow-hidden border-b border-white/10 bg-black/20 p-3">
                    <SafeImage
                      src={p.image_url}
                      alt={p.part_number}
                      className="max-h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{p.manufacturer || brand}</span>
                    <span className="truncate font-mono text-sm font-bold text-orange-200 transition-colors group-hover:text-orange-100">
                      {p.part_number}
                    </span>
                    {p.description ? <p className="line-clamp-2 text-xs text-white/50">{p.description}</p> : null}
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
