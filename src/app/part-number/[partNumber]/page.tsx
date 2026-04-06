import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import Script from 'next/script'
import { API_BASE_URL, SITE_URL, BRAND_SLUG_MAP, normalizeCategoryQueryForApi } from '@/app/lib/constants'
import { getProduct } from '@/lib/api'
import { ProductHero } from '@/components/product/ProductHero'
import { SpecsGrid } from '@/components/product/SpecsGrid'
import { TabsSection } from '@/components/product/TabsSection'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { ProductStickyCtas } from '@/components/product/ProductStickyCtas'
import { ViewProductTracker } from '@/components/analytics/ViewProductTracker'
import type { Metadata } from 'next'
import { Building2, Globe2, ShieldCheck, Truck } from 'lucide-react'

const API_BASE = API_BASE_URL

interface Props {
  params: Promise<{ partNumber: string }>
}

const getProductCached = cache(async (partNumber: string) => getProduct(decodeURIComponent(partNumber).trim()))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { partNumber } = await params
  const decoded = decodeURIComponent(partNumber)
  let product: Record<string, unknown> | null = null
  try {
    product = await getProductCached(decoded)
  } catch {
    product = null
  }
  if (!product) {
    const title = `${decoded} | Buy Industrial Parts`
    const description = `Buy ${decoded} with fast delivery.`
    const canonical = `${SITE_URL}/part-number/${encodeURIComponent(decoded)}`
    return {
      title,
      description,
      keywords: [decoded, 'industrial automation', 'buy PLC', 'industrial parts'],
      alternates: { canonical },
      openGraph: {
        title,
        description,
        images: ['/placeholder.png'],
        url: canonical,
        type: 'website',
      },
      robots: { index: true, follow: true },
    }
  }
  const brandName = String(product.brand ?? product.manufacturer ?? 'Industrial')
  const categoryName =
    typeof product.category === 'string'
      ? product.category
      : (product.category && typeof product.category === 'object' && 'name' in product.category
          ? String((product.category as { name?: unknown }).name || '')
          : '')
  const partNum = String(product.part_number ?? '')
  const title = `${partNum} | ${brandName} | Buy Industrial Parts`
  const description = product.description || `Buy ${partNum} with fast delivery.`
  const canonical = `${SITE_URL}/part-number/${encodeURIComponent(partNum)}`
  const comboKeyword = [brandName, categoryName].filter(Boolean).join(' ')
  return {
    title,
    description: typeof description === 'string' ? description.slice(0, 160) : '',
    keywords: [
      partNum,
      brandName,
      categoryName,
      comboKeyword,
      'industrial automation',
      'buy PLC',
      'industrial parts',
    ].filter(Boolean),
    alternates: { canonical },
    openGraph: {
      title: partNum,
      description: typeof description === 'string' ? description.slice(0, 160) : '',
      images: [String(product.image_url || '/placeholder.png')],
      url: canonical,
      type: 'website',
    },
    robots: { index: true, follow: true },
  }
}

export const dynamic = 'force-dynamic'

function toBrandSlug(name: string): string {
  if (!name) return ''
  const fromMap = BRAND_SLUG_MAP[name]
  if (fromMap) return fromMap
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function toSchemaAvailability(availability?: string): string {
  const value = (availability || '').toLowerCase()
  if (value.includes('stock') || value.includes('available')) return 'https://schema.org/InStock'
  if (value.includes('preorder')) return 'https://schema.org/PreOrder'
  return 'https://schema.org/OutOfStock'
}

function asOptString(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v === 'string') return v
  return undefined
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  const a = v.filter((x): x is string => typeof x === 'string')
  return a.length ? a : undefined
}

function buildImageSrc(product: Record<string, unknown>): string {
  return String(product.image_url ?? '')
}

function buildDatasheetUrl(product: Record<string, unknown>, apiBase: string): string | null {
  const raw = product.datasheet_url ?? product.datasheet
  const url = Array.isArray(raw) ? raw[0] : raw
  if (typeof url === 'string' && url.startsWith('http')) return url
  if (typeof url === 'string' && url)
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`
  return null
}

function normalizeSpecs(product: Record<string, unknown>): Record<string, unknown> {
  const raw = product.specifications
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {}
  }
  const fallback: Record<string, unknown> = {}
  for (const key of ['voltage', 'current', 'mounting_type', 'protection_rating', 'series']) {
    const value = product[key]
    if (value != null && String(value).trim() !== '') fallback[key] = String(value)
  }
  return fallback
}

export default async function PartNumberPage({ params }: Props) {
  const { partNumber } = await params
  const decoded = decodeURIComponent(partNumber)

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[PartNumberPage] part_number=%s', decoded)
  }

  const product = await getProductCached(decoded)

  if (!product) return notFound()

  const partNum = String(product.part_number ?? decoded).trim() || decoded

  const categoryName =
    typeof product.category === 'string'
      ? product.category
      : (product.category && typeof product.category === 'object' && 'name' in product.category
          ? String((product.category as { name?: unknown }).name || '')
          : '')
  const imgSrc = buildImageSrc(product)
  const datasheetFullUrl = buildDatasheetUrl(product, API_BASE)
  const specs = normalizeSpecs(product)
  const brandName = String(product.brand ?? product.manufacturer ?? '').trim()
  const brandSlug = toBrandSlug(brandName)
  const brandHref = brandSlug ? `/brand/${encodeURIComponent(brandSlug)}` : null
  const categorySlugForLinks = categoryName ? normalizeCategoryQueryForApi(categoryName) : ''
  const categoryHref = categorySlugForLinks ? `/categories/${categorySlugForLinks}` : null
  const canonicalUrl = `${SITE_URL}/part-number/${encodeURIComponent(partNum)}`
  const similarProducts = (product.similar_products ?? []) as Array<{
    part_number: string
    brand?: string
    manufacturer?: string
    image_url?: string
    images?: string[]
  }>
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name || product.part_number,
    image: product.image_url ? [product.image_url] : [`${SITE_URL}/placeholder.png`],
    description: product.description || `Buy ${product.part_number} with fast delivery.`,
    sku: product.part_number,
    category: categoryName || 'Industrial Parts',
    url: canonicalUrl,
    brand: {
      '@type': 'Brand',
      name: product.brand ?? product.manufacturer ?? 'Industrial',
    },
    offers: {
      '@type': 'Offer',
      availability: toSchemaAvailability(
        typeof product.availability === 'string' ? product.availability : undefined
      ),
      url: canonicalUrl,
    },
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827]">
      <ViewProductTracker partNumber={partNum} />
      <Script
        id="part-number-product-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="page-container flex h-16 items-center gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-[#0B1F3A]">
            AdvancedSystems
          </Link>
          <form action="/search" className="hidden md:flex flex-1 max-w-2xl">
            <input
              name="q"
              placeholder="Search by part number, brand, category..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-[#0B1F3A]"
            />
          </form>
          <nav className="hidden lg:flex items-center gap-5 text-sm text-slate-600">
            <Link href="/brands" className="hover:text-[#0B1F3A]">Brands</Link>
            <Link href="/categories" className="hover:text-[#0B1F3A]">Categories</Link>
          </nav>
          <Link
            href={`/rfq?part_number=${encodeURIComponent(partNum)}`}
            className="ml-auto inline-flex items-center rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#ff9b45] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-300/50 transition hover:scale-[1.02]"
          >
            ⚡ Get Price in 2 Minutes
          </Link>
        </div>
      </header>

      <div className="page-container pt-8 pb-24 md:py-10">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          {categoryName && (
            <>
              <Link
                href={
                  categorySlugForLinks
                    ? `/categories/${categorySlugForLinks}`
                    : `/search?category=${encodeURIComponent(normalizeCategoryQueryForApi(categoryName))}`
                }
                className="hover:text-blue-600 transition-colors"
              >
                {categoryName}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          {brandName && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={brandHref || `/search?brand=${encodeURIComponent(brandName)}`}
                className="hover:text-blue-600 transition-colors"
              >
                {brandName}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{partNum}</span>
        </nav>

        <ProductHero
          product={{
            part_number: partNum,
            name: asOptString(product.name),
            brand: asOptString(product.brand ?? product.manufacturer),
            manufacturer: asOptString(product.manufacturer),
            brand_logo_url: asOptString(product.brand_logo_url),
            category: categoryName || undefined,
            availability: asOptString(product.availability),
            image_url: asOptString(product.image_url),
            images: asStringArray(product.images),
            description: asOptString(product.description),
            specifications: specs,
            series: asOptString(product.series),
            voltage: asOptString(product.voltage),
            current: asOptString(product.current),
            mounting_type: asOptString(product.mounting_type),
          }}
          imageSrc={imgSrc}
          imageAlt={partNum}
          apiBase={API_BASE}
          datasheetUrl={datasheetFullUrl}
          productBasePath="/part-number"
          brandHref={brandHref}
          categoryHref={categoryHref}
        />

        <div className="mt-10">
          <SpecsGrid specs={specs} fallbackSeries={asOptString(product.series)} />
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-lg shadow-slate-200/60">
          <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Technical Confidence</h2>
          <p className="mt-1 text-sm text-slate-500">
            Practical engineering context to support faster qualification.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Applications</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>Industrial automation and control panels</li>
                <li>Process lines requiring reliable component replacement</li>
                <li>{categoryName || 'Factory systems'} maintenance and upgrades</li>
              </ul>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Compatible systems</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>{brandName || 'Multi-brand'} industrial platforms</li>
                <li>PLC, HMI, drives, and instrumentation ecosystems</li>
                <li>Retrofit and brownfield integration scenarios</li>
              </ul>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Use cases</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>Urgent replacement for downtime recovery</li>
                <li>Planned shutdown spares sourcing</li>
                <li>Engineering validation before fleet rollout</li>
              </ul>
            </article>
          </div>
        </section>

        <div className="mt-10">
          <TabsSection description={asOptString(product.description)} specs={specs} datasheetUrl={datasheetFullUrl} />
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-lg shadow-slate-200/60">
          <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Trust Block</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#FF7A00]" /> 100% Original Parts
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
              <Truck className="h-4 w-4 text-[#FF7A00]" /> Fast Delivery (24–72h)
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
              <Building2 className="h-4 w-4 text-[#FF7A00]" /> Engineering Support
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
              <Globe2 className="h-4 w-4 text-[#FF7A00]" /> Global Sourcing
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Limited stock available - Fast response within minutes
          </div>
        </section>

        {similarProducts.length > 0 && (
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-lg shadow-slate-200/60">
            <RelatedProducts
              products={similarProducts}
              productBasePath="/part-number"
              imageUrl={(item) => item.image_url || ''}
              title="Similar Products"
            />
          </div>
        )}
      </div>

      <ProductStickyCtas partNumber={partNum} />
    </div>
  )
}
