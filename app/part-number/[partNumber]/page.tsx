import Link from 'next/link'
import { notFound } from 'next/navigation'
import { API_BASE_URL, SITE_URL, categoryToSlug } from '@/app/lib/constants'
import { resolveProductImage } from '@/lib/imageResolver'
import { ProductHero } from '@/components/product/ProductHero'
import { ProductDescriptionSpecsTabs } from '@/components/product/ProductDescriptionSpecsTabs'
import { ProductSpecsCards } from '@/components/product/ProductSpecsCards'
import { ProductSpecificationsTable } from '@/components/product/ProductSpecificationsTable'
import { ProductDocumentation } from '@/components/product/ProductDocumentation'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { RFQButton } from '@/components/RFQButton'
import type { Metadata } from 'next'

const API_BASE = API_BASE_URL

interface Props {
  params: Promise<{ partNumber: string }>
}

async function fetchProduct(partNumber: string) {
  const decoded = decodeURIComponent(partNumber).trim()
  try {
    const res = await fetch(
      `${API_BASE}/products?search=${encodeURIComponent(decoded)}&limit=10`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    const list = data?.products ?? data?.results ?? data?.items ?? (Array.isArray(data) ? data : [])
    const product =
      list.find((p: any) => (p.part_number || p.partNumber || '').trim() === decoded) ??
      list[0]
    return product && (product.part_number || product.partNumber) ? product : null
  } catch {
    return null
  }
}

async function fetchIntelligence(partNumber: string) {
  try {
    const res = await fetch(
      `${API_BASE}/api/intelligence/detect?part_number=${encodeURIComponent(partNumber)}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/** Extract search prefix from part number (e.g. 6ES7322-1BL00-0AA0 → 6ES7) */
function partNumberToPrefix(partNumber: string, length: number = 4): string {
  const normalized = partNumber.replace(/\s/g, '').replace(/-/g, '').toUpperCase()
  return normalized.slice(0, length) || partNumber.slice(0, length) || partNumber
}

async function fetchSimilarProducts(
  partNumber: string,
  intelligence: { brand?: string | null; category?: string | null } | null,
  prefixOnly: boolean = false
) {
  const results: Array<{ part_number: string; brand?: string; manufacturer?: string; category?: string; image_url?: string; images?: string[] }> = []
  const seen = new Set<string>()
  const prefix = partNumberToPrefix(partNumber, 4)

  try {
    const res = await fetch(
      `${API_BASE}/search?q=${encodeURIComponent(prefix)}&limit=12`,
      { cache: 'no-store' }
    )
    if (res.ok) {
      const data = await res.json()
      const list = data.results ?? data.products ?? []
      for (const p of list) {
        const pn = p.part_number ?? p.partNumber
        if (pn && !seen.has(pn)) {
          seen.add(pn)
          results.push({
            part_number: pn,
            brand: p.brand ?? p.manufacturer,
            manufacturer: p.manufacturer ?? p.brand,
            category: p.category,
            image_url: p.image_url,
            images: p.images,
          })
        }
      }
    }
  } catch {
    // ignore
  }

  if (results.length >= 8) return results.slice(0, 8)
  if (prefixOnly) return results.slice(0, 8)

  const brand = intelligence?.brand ?? intelligence?.category
  if (brand && typeof brand === 'string') {
    try {
      const res = await fetch(
        `${API_BASE}/search?brand=${encodeURIComponent(brand)}&limit=${8 - results.length}`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const data = await res.json()
        const list = data.results ?? data.products ?? []
        for (const p of list) {
          const pn = p.part_number ?? p.partNumber
          if (pn && !seen.has(pn)) {
            seen.add(pn)
            results.push({
              part_number: pn,
              brand: p.brand ?? p.manufacturer,
              manufacturer: p.manufacturer ?? p.brand,
              category: p.category,
              image_url: p.image_url,
              images: p.images,
            })
            if (results.length >= 8) break
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return results.slice(0, 8)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { partNumber } = await params
  const decoded = decodeURIComponent(partNumber)
  const product = await fetchProduct(decoded)
  if (!product) {
    const title = `Buy ${decoded} | Supplier & RFQ | Advanced Systems`
    const description = `Buy ${decoded}. Request quote, price, and availability from Advanced Systems industrial automation supplier.`
    const canonical = `${SITE_URL}/part-number/${encodeURIComponent(decoded)}`
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        type: 'website',
      },
      robots: { index: true, follow: true },
    }
  }
  const brandName = product.brand ?? product.manufacturer ?? 'Industrial'
  const title = `${product.part_number} – Industrial Automation Part`
  const description =
    product.seo_description ??
    product.description ??
    `Buy ${product.part_number} (${brandName}) – industrial automation component. Datasheet, specifications & RFQ.`
  const canonical = `${SITE_URL}/part-number/${encodeURIComponent(product.part_number)}`
  return {
    title,
    description: typeof description === 'string' ? description.slice(0, 160) : '',
    alternates: { canonical },
    openGraph: {
      title,
      description: typeof description === 'string' ? description.slice(0, 160) : '',
      url: canonical,
      type: 'website',
    },
    robots: { index: true, follow: true },
  }
}

export const dynamic = 'force-dynamic'

function buildImageSrc(product: Record<string, unknown>): string {
  const partNumber = product.part_number as string | undefined
  return resolveProductImage(partNumber)
}

function buildDatasheetUrl(product: Record<string, unknown>, apiBase: string): string | null {
  const raw = product.datasheet_url ?? product.datasheet
  const url = Array.isArray(raw) ? raw[0] : raw
  if (typeof url === 'string' && url.startsWith('http')) return url
  if (typeof url === 'string' && url)
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`
  return null
}

export default async function PartNumberPage({ params }: Props) {
  const { partNumber } = await params
  const decoded = decodeURIComponent(partNumber)

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[PartNumberPage] part_number=%s', decoded)
  }

  const product = await fetchProduct(decoded)

  if (!product) return notFound()

  const categoryName = product.category ?? ''
  const imgSrc = buildImageSrc(product)
  const datasheetFullUrl = buildDatasheetUrl(product, API_BASE)
  const similarProducts = (product.similar_products ?? []) as Array<{
    part_number: string
    brand?: string
    manufacturer?: string
    image_url?: string
    images?: string[]
  }>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-container py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          {categoryName && (
            <>
              <Link
                href={
                  categoryToSlug(categoryName)
                    ? `/category/${categoryToSlug(categoryName)}`
                    : `/search?category=${encodeURIComponent(categoryName)}`
                }
                className="hover:text-blue-600 transition-colors"
              >
                {categoryName}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{product.part_number}</span>
        </nav>

        <ProductHero
          product={{
            part_number: product.part_number,
            brand: product.brand ?? product.manufacturer,
            manufacturer: product.manufacturer,
            category: product.category,
            availability: product.availability,
            image_url: product.image_url,
            images: product.images,
            description: product.description,
            specifications: product.specifications && typeof product.specifications === 'object' ? product.specifications : null,
            series: product.series,
            voltage: product.voltage,
            current: product.current,
            mounting_type: product.mounting_type,
          }}
          imageSrc={imgSrc}
          imageAlt={product.part_number}
          apiBase={API_BASE}
          datasheetUrl={datasheetFullUrl}
          productBasePath="/part-number"
          categoryHref={
            categoryName
              ? categoryToSlug(categoryName)
                ? `/category/${categoryToSlug(categoryName)}`
                : `/search?category=${encodeURIComponent(categoryName)}`
              : null
          }
        />

        {/* Description & Specifications tabs */}
        <div className="mt-10">
          <ProductDescriptionSpecsTabs
            description={product.description}
            specifications={
              product.specifications && typeof product.specifications === 'object'
                ? product.specifications
                : null
            }
            specs={product.specs ?? null}
          />
        </div>

        {/* Key specs cards */}
        <div className="mt-10">
          <ProductSpecsCards
            product={{
              specifications: product.specifications,
              series: product.series,
              voltage: product.voltage,
              current: product.current,
              mounting_type: product.mounting_type,
            }}
          />
        </div>

        {/* Full specifications table */}
        <div className="mt-10">
          <ProductSpecificationsTable
            specifications={
              product.specifications && typeof product.specifications === 'object'
                ? product.specifications
                : null
            }
          />
        </div>

        {/* RFQ box */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Request a Quote
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md flex flex-wrap items-center gap-4">
            <RFQButton partNumber={product.part_number} variant="default" />
            <p className="text-sm text-gray-600">
              Need a quote for {product.part_number}? We&apos;ll respond quickly
              with pricing and availability.
            </p>
          </div>
        </section>

        {/* Documentation */}
        <div className="mt-10">
          <ProductDocumentation
            partNumber={product.part_number}
            datasheetUrl={datasheetFullUrl}
            apiBase={API_BASE}
          />
        </div>

        {/* Related products */}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <RelatedProducts
              products={similarProducts}
              productBasePath="/part-number"
              imageUrl={(item) => resolveProductImage(item.part_number)}
              title="Similar Products"
            />
          </div>
        )}
      </div>
    </div>
  )
}
