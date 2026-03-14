import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ArrowLeft, ChevronRight } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { getBrandHref } from '@/lib/brandUtils'
import { categoryToSlug } from '@/app/lib/constants'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://advancedsystems-int.com'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface Props {
  params: Promise<{ part_number: string }>
}

async function fetchProduct(partNumber: string) {
  try {
    const res = await fetch(`${API_BASE}/product/${encodeURIComponent(partNumber)}`, { next: { revalidate: 3600 } })
    if (res.ok) return res.json()
    if (res.status === 404) {
      const orRes = await fetch(`${API_BASE}/api/v1/products/part/${encodeURIComponent(partNumber)}/or-generate`, { next: { revalidate: 3600 } })
      if (orRes.ok) return orRes.json()
    }
    return null
  } catch {
    return null
  }
}

async function fetchAlternatives(partNumber: string) {
  try {
    const res = await fetch(`${API_BASE}/product/${encodeURIComponent(partNumber)}/cross-references?limit=12`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data?.alternatives || []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { part_number } = await params
  const product = await fetchProduct(decodeURIComponent(part_number))
  if (!product) return { title: 'Alternatives Not Found' }

  const brandName = product.manufacturer || product.brand || 'Industrial'
  const pn = product.part_number || part_number
  const title = `${pn} Alternatives & Replacements – Equivalent Parts | ${brandName}`
  const desc = `Find alternatives and equivalent replacements for ${pn}. Cross-brand equivalents, same-series options, and compatible industrial automation parts.`

  const canonical = `${SITE_URL}/alternatives/${encodeURIComponent(pn)}`

  return {
    title,
    description: desc.slice(0, 160),
    keywords: `${pn}, alternatives, replacement, equivalent, cross reference, ${brandName}`.split(', ').filter(Boolean).join(', '),
    alternates: { canonical },
    openGraph: {
      title,
      description: desc.slice(0, 160),
      url: canonical,
      type: 'website',
    },
    twitter: { card: 'summary', title, description: desc.slice(0, 160) },
    robots: { index: true, follow: true },
  }
}

export const revalidate = 3600

function imageUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

export default async function AlternativesPage({ params }: Props) {
  const { part_number } = await params
  const [product, alternatives] = await Promise.all([
    fetchProduct(decodeURIComponent(part_number)),
    fetchAlternatives(decodeURIComponent(part_number)),
  ])

  if (!product) notFound()

  const pn = product.part_number || part_number
  const brandName = product.manufacturer || product.brand
  const categoryName = product.category

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-12">
        <nav className="text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          {categoryName && (
            <>
              <Link href={categoryToSlug(String(categoryName)) ? `/category/${categoryToSlug(String(categoryName))}` : `/search?category=${encodeURIComponent(categoryName)}`} className="hover:text-primary-600">{categoryName}</Link>
              <span className="mx-2">/</span>
            </>
          )}
          <Link href={`/part-number/${encodeURIComponent(pn)}`} className="hover:text-primary-600">{pn}</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">Alternatives</span>
        </nav>

        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {pn} Alternatives & Replacements
          </h1>
          <p className="text-slate-600 mb-8">
            Equivalent or compatible parts for {pn}. {brandName && `${brandName} `}{categoryName && `${categoryName}. `}
            Cross-brand equivalents and same-series options.
          </p>

          {alternatives.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {alternatives.map((alt: any) => (
                <Link
                  key={alt.part_number}
                  href={`/part-number/${encodeURIComponent(alt.part_number || '')}`}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className="relative aspect-square bg-slate-50 flex items-center justify-center p-6">
                    {alt.image_url ? (
                      <Image
                        src={imageUrl(alt.image_url)}
                        alt={alt.part_number}
                        width={160}
                        height={160}
                        className="object-contain max-h-full w-auto group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Package className="w-20 h-20 text-slate-300" />
                    )}
                    {alt.match_type && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
                        {String(alt.match_type).replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    {alt.manufacturer && (
                      <div className="mb-2">
                        <BrandLogo brand={alt.manufacturer} logoClassName="h-6 max-w-[80px] object-contain" badgeClassName="hidden" />
                      </div>
                    )}
                    <span className="font-mono font-semibold text-slate-900 text-lg block truncate">
                      {alt.part_number}
                    </span>
                    {alt.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{alt.description}</p>
                    )}
                    <span className="mt-auto pt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 group-hover:text-primary-700">
                      View Product <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No alternatives in database</h2>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                We don&apos;t have cross-reference data for {pn} yet. Request a quote and our team can suggest equivalents.
              </p>
              <Link
                href={`/rfq?part_number=${encodeURIComponent(pn)}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold"
              >
                Request Quote
              </Link>
            </div>
          )}

          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              href={`/part-number/${encodeURIComponent(pn)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 hover:border-primary-500 hover:bg-primary-50 text-slate-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {pn}
            </Link>
            {brandName && (
              <Link
                href={getBrandHref({ name: brandName })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 hover:border-primary-500 hover:bg-primary-50 text-slate-700 font-medium transition-colors"
              >
                {brandName} products
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
