import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Script from 'next/script'
import { getProduct, getProducts, apiFetch } from '@/lib/api'
import { normalizeCategoryQueryForApi, SITE_URL } from '@/app/lib/constants'
import { ProductDetail } from './ProductDetail'
import { SafeImage } from '@/components/common/SafeImage'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
const RecommendationSections = dynamic(
  () => import('./RecommendationSections').then((m) => m.RecommendationSections),
  {
    loading: () => (
      <div className="mt-10 rounded-xl border border-[#E5E7EB] bg-white p-6">
        <div className="skeleton h-6 w-52 mb-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-lg" />
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
)

interface Props {
  params: Promise<{ part_number: string }>
}

function looksLikePartNumber(raw: string): boolean {
  const u = decodeURIComponent(raw).toUpperCase().replace(/[\s_-]/g, '')
  return u.length >= 5 && /\d/.test(u)
}

const getProductCached = cache(async (pn: string) => getProduct(decodeURIComponent(pn).trim()))

export async function generateStaticParams() {
  try {
    const data = (await getProducts({ page: 1, size: 500, include_unready: true })) as {
      items?: Array<{ part_number?: string }>
      products?: Array<{ part_number?: string }>
    }
    const rows = data.items ?? data.products ?? []
    return rows
      .map((r) => (r.part_number || '').trim())
      .filter(Boolean)
      .map((pn) => ({ part_number: encodeURIComponent(pn) }))
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
    } catch { /* skip */ }
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
    const val = typeof v === 'object' && 'value' in (v as Record<string, unknown>)
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
  const { part_number: rawParam } = await params
  const decoded = decodeURIComponent(rawParam)

  let product: Record<string, unknown> | null = null
  try { product = await getProductCached(decoded) } catch { product = null }

  if (!product && !looksLikePartNumber(decoded)) {
    const brand = decoded.replace(/\b\w/g, (l) => l.toUpperCase())
    return {
      title: `${brand} Industrial Automation Parts | Advanced Systems`,
      description: `Buy ${brand} industrial automation spare parts.`,
      alternates: { canonical: `${SITE_URL}/products/${encodeURIComponent(rawParam)}` },
    }
  }

  const partNum = String(product?.part_number ?? decoded)
  const productName = String(product?.name ?? partNum).trim() || partNum
  const brandName = String(product?.brand ?? product?.manufacturer ?? 'Industrial')
  const categoryName =
    typeof product?.category === 'string'
      ? product.category
      : typeof product?.category === 'object' && product?.category && 'name' in (product.category as Record<string, unknown>)
        ? String((product.category as { name?: unknown }).name ?? '')
        : 'Industrial Parts'
  const description = String(product?.description || `Buy ${productName} with fast delivery.`).slice(0, 160)
  const canonicalUrl = `${SITE_URL}/products/${encodeURIComponent(partNum)}`

  return {
    title: `${productName} | ${brandName} | ${categoryName}`,
    description,
    keywords: [productName, partNum, brandName, categoryName, 'industrial automation'],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${productName} | ${brandName}`,
      description,
      url: canonicalUrl,
      images: [String(product?.image_url || '/placeholder.png')],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${productName} | ${brandName}`,
      description,
      images: [String(product?.image_url || '/placeholder.png')],
    },
    robots: { index: true, follow: true },
  }
}

export default async function ProductPartNumberPage({ params }: Props) {
  const { part_number: rawParam } = await params
  const decoded = decodeURIComponent(rawParam)
  let product: Record<string, unknown> | null = null
  try { product = await getProductCached(decoded) } catch { product = null }
  if (!product && !looksLikePartNumber(decoded)) return <BrandPage brandSlug={decoded} />
  if (!product) return notFound()

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
  const productUrl = `${SITE_URL}/products/${encodeURIComponent(partNum)}`
  const keywordSeed = `${productName} ${brandName} ${categoryName} ${series}`.trim()

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    image: galleryImages.length ? galleryImages : [`${SITE_URL}/placeholder.png`],
    description: description || `Buy ${productName} with fast delivery.`,
    sku: partNum,
    category: categoryName || 'Industrial Parts',
    brand: brandName || 'Industrial',
    url: productUrl,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      availability: toSchemaAvailability(availability),
      ...(typeof product.price_usd === 'number' ? { price: product.price_usd, priceCurrency: 'USD' } : {}),
    },
  }

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
  ]
  if (categoryName && categorySlugForQuery) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: categoryName,
      item: `${SITE_URL}/products?category=${encodeURIComponent(categorySlugForQuery)}`,
    })
  }
  if (brandName) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: brandName,
      item: `${SITE_URL}/products?brand=${encodeURIComponent(brandName)}`,
    })
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: partNum,
    item: `${SITE_URL}/products/${encodeURIComponent(partNum)}`,
  })

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-[#6B7280]" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-[#0072CE]">Home</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-[#0072CE]">Products</Link></li>
            {categoryName && categorySlugForQuery && (<><li>/</li><li><Link href={`/products?category=${encodeURIComponent(categorySlugForQuery)}`} className="hover:text-[#0072CE]">{categoryName}</Link></li></>)}
            {brandName && (<><li>/</li><li><Link href={`/products?brand=${encodeURIComponent(brandName)}`} className="hover:text-[#0072CE]">{brandName}</Link></li></>)}
            <li>/</li>
            <li className="text-[#1A1A1A] font-medium font-mono">{partNum}</li>
          </ol>
        </nav>

        <ProductDetail
          partNumber={partNum}
          brandName={brandName}
          categoryName={categoryName}
          description={description}
          series={series}
          specs={specs}
          galleryImages={galleryImages}
          datasheetUrl={datasheetUrl}
          availability={availability}
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
  let products: Array<{ part_number: string; manufacturer?: string; image_url?: string; description?: string }> = []
  let fetchError = false
  try {
    const params = new URLSearchParams({ q: '', brand, page: '1', limit: '20' })
    const res = await apiFetch(`${API_BASE}/api/v1/search/?${params}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      products = data?.hits ?? data?.results ?? data?.products ?? []
    } else {
      fetchError = true
    }
  } catch {
    fetchError = true
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-xs text-[#6B7280] mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#0072CE]">Home</Link>
            <span className="mx-1">/</span>
            <Link href="/products" className="hover:text-[#0072CE]">Products</Link>
            <span className="mx-1">/</span>
            <span className="text-[#1A1A1A]">{brand}</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">{brand} Industrial Automation Parts</h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {fetchError ? (
          <p className="text-[#EF4444] text-center py-16">Unable to load products.</p>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-[#6B7280]">
            <p className="text-lg mb-4">No products found for <strong>{brand}</strong>.</p>
            <Link href="/products" className="inline-flex px-5 py-2.5 rounded-[2px] bg-[#0072CE] text-white font-medium text-sm">Browse All</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <Link
                key={p.part_number}
                href={`/products/${encodeURIComponent(p.part_number)}`}
                className="group flex flex-col rounded-[2px] border border-[#E5E7EB] bg-white overflow-hidden hover:border-[#0072CE]/40 hover:shadow-sm hover:-translate-y-px transition-all duration-150"
              >
                <div className="aspect-square flex items-center justify-center p-3 bg-[#F9FAFB] border-b border-[#E5E7EB] overflow-hidden">
                  <SafeImage
                    src={p.image_url}
                    alt={p.part_number}
                    className="max-h-full w-full object-contain group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>
                <div className="p-3 flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">{p.manufacturer || brand}</span>
                  <span className="font-bold text-sm text-[#1A1A1A] font-mono truncate group-hover:text-[#0072CE] transition-colors duration-150">{p.part_number}</span>
                  {p.description && <p className="text-xs text-[#6B7280] line-clamp-2">{p.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
