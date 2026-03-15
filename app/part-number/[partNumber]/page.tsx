import Link from 'next/link'
import Image from 'next/image'
import {
  API_BASE_URL,
  SITE_URL,
  resolveProductImageUrl,
  categoryToSlug,
} from '@/app/lib/constants'
import { RFQButton } from '@/components/RFQButton'
import { FileText, Package, Search } from 'lucide-react'
import type { Metadata } from 'next'

const API_BASE = API_BASE_URL

interface Props {
  params: Promise<{ partNumber: string }>
}

async function fetchProduct(partNumber: string) {
  const decoded = decodeURIComponent(partNumber)
  try {
    const res = await fetch(
      `${API_BASE}/product/${encodeURIComponent(decoded)}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data && (data.part_number || data.partNumber) ? data : null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { partNumber } = await params
  const decoded = decodeURIComponent(partNumber)
  const product = await fetchProduct(decoded)
  if (!product) {
    return {
      title: 'Product Not Found',
      description: `Part ${decoded} could not be found. Search or request a quote.`,
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

export default async function PartNumberPage({ params }: Props) {
  const { partNumber } = await params
  const decoded = decodeURIComponent(partNumber)
  const product = await fetchProduct(decoded)

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <div className="page-container py-16 sm:py-24">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Product Not Found
            </h1>
            <p className="text-slate-600 mb-6">
              We couldn&apos;t find a listing for{' '}
              <span className="font-mono font-medium text-slate-800">
                {decoded}
              </span>
              . Try searching or submit an RFQ and we&apos;ll help you source it.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href={`/search?q=${encodeURIComponent(decoded)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                <Search className="w-4 h-4" />
                Search for similar parts
              </Link>
              <Link
                href={`/rfq?part_number=${encodeURIComponent(decoded)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-medium text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                Request quote for {decoded}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const brandName = product.brand ?? product.manufacturer ?? ''
  const categoryName = product.category ?? ''
  const imageUrl =
    product.image_url ??
    (Array.isArray(product.images) ? product.images[0] : null) ??
    null
  const imgSrc = imageUrl
    ? typeof imageUrl === 'string' && imageUrl.startsWith('http')
      ? imageUrl
      : typeof imageUrl === 'string'
        ? `${API_BASE}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
        : resolveProductImageUrl(product, API_BASE)
    : resolveProductImageUrl(product, API_BASE)
  const rawDatasheet = product.datasheet_url ?? product.datasheet
  const datasheetUrl = Array.isArray(rawDatasheet)
    ? rawDatasheet[0]
    : rawDatasheet
  const datasheetFullUrl =
    typeof datasheetUrl === 'string' && datasheetUrl.startsWith('http')
      ? datasheetUrl
      : typeof datasheetUrl === 'string' && datasheetUrl
        ? `${API_BASE}${datasheetUrl.startsWith('/') ? '' : '/'}${datasheetUrl}`
        : null

  return (
    <div className="min-h-screen bg-white">
      <div className="page-container py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-accent-600 transition-colors">
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
                className="hover:text-accent-600 transition-colors"
              >
                {categoryName}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-slate-900 font-medium">{product.part_number}</span>
        </nav>

        {/* Header section */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
            {product.part_number}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {brandName && (
              <span className="font-medium text-slate-600">{brandName}</span>
            )}
            {categoryName && (
              <span className="text-slate-500">
                {brandName ? ' · ' : ''}
                <Link
                  href={
                    categoryToSlug(categoryName)
                      ? `/category/${categoryToSlug(categoryName)}`
                      : `/search?category=${encodeURIComponent(categoryName)}`
                  }
                  className="text-accent-600 hover:underline"
                >
                  {categoryName}
                </Link>
              </span>
            )}
          </div>
        </header>

        {/* Main content: two columns */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Left column: Product image + gallery placeholder */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              {imgSrc && imgSrc !== '/products/no-product-image.jpg' ? (
                <Image
                  src={imgSrc}
                  alt={product.part_number}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  unoptimized={
                    imgSrc.startsWith('http') && !imgSrc.includes(API_BASE)
                  }
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-24 h-24 text-slate-300" />
                </div>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50/50 px-4 py-6 text-center">
              <p className="text-sm text-slate-500">
                Gallery support coming soon
              </p>
            </div>
          </div>

          {/* Right column: Product information */}
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
                Product Information
              </h2>
              <dl className="space-y-3">
                {brandName && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase">
                      Brand
                    </dt>
                    <dd className="mt-0.5 text-slate-900 font-medium">
                      {brandName}
                    </dd>
                  </div>
                )}
                {categoryName && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase">
                      Category
                    </dt>
                    <dd className="mt-0.5">
                      <Link
                        href={
                          categoryToSlug(categoryName)
                            ? `/category/${categoryToSlug(categoryName)}`
                            : `/search?category=${encodeURIComponent(categoryName)}`
                        }
                        className="text-accent-600 hover:underline font-medium"
                      >
                        {categoryName}
                      </Link>
                    </dd>
                  </div>
                )}
                {product.series && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase">
                      Series
                    </dt>
                    <dd className="mt-0.5 text-slate-900">{product.series}</dd>
                  </div>
                )}
                {product.description && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase">
                      Description
                    </dt>
                    <dd className="mt-1 text-slate-700 leading-relaxed">
                      {product.description}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {product.availability && (
              <p className="text-sm">
                <span
                  className={
                    product.availability === 'in_stock'
                      ? 'text-green-600 font-medium'
                      : 'text-amber-600 font-medium'
                  }
                >
                  {product.availability === 'in_stock'
                    ? 'In stock'
                    : 'On request'}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Product Specifications placeholder */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Product Specifications
          </h2>
          <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50/50 px-6 py-8 text-center">
            <p className="text-slate-500 text-sm">
              Specifications will be displayed here when available.
            </p>
          </div>
        </section>

        {/* RFQ box placeholder */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Request a Quote
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-wrap items-center gap-4">
            <RFQButton partNumber={product.part_number} variant="default" />
            <p className="text-sm text-slate-600">
              Need a quote for {product.part_number}? We&apos;ll respond quickly
              with pricing and availability.
            </p>
          </div>
        </section>

        {/* Datasheet placeholder */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Datasheet &amp; Documents
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            {datasheetFullUrl ? (
              <a
                href={datasheetFullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Datasheet
              </a>
            ) : (
              <p className="text-sm text-slate-500">
                Datasheet not yet available for this product.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
