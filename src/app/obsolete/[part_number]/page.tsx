import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ArrowLeft } from 'lucide-react'
import { getProductOrGenerate } from '@/lib/api'
import { categoryToSlug } from '@/lib/constants'
import { getBrandHref } from '@/lib/brandUtils'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://advancedsystems-int.com'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface Props {
  params: Promise<{ part_number: string }>
}

async function fetchProduct(partNumber: string) {
  try {
    return await getProductOrGenerate(partNumber)
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
  if (!product) return { title: 'Obsolete Part Not Found' }
  const brandName = product.brand?.name || product.manufacturer || 'Industrial'
  const pn = product.part_number || part_number
  const title = `${pn} Discontinued / Obsolete – Replacement Parts | ${brandName}`
  const desc = `${pn} may be discontinued or difficult to find. This page lists possible replacement components and suppliers.`.slice(0, 160)
  const canonical = `${SITE_URL}/obsolete/${encodeURIComponent(pn)}`
  return {
    title,
    description: desc,
    keywords: `${pn}, obsolete, discontinued, replacement, equivalent, ${brandName}`.split(', ').filter(Boolean).join(', '),
    alternates: { canonical },
    openGraph: { title, description: desc, url: canonical, type: 'website' },
    twitter: { card: 'summary', title, description: desc },
    robots: { index: true, follow: true },
  }
}

export const revalidate = 3600

function imageUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

export default async function ObsoletePage({ params }: Props) {
  const { part_number } = await params
  const [product, alternatives] = await Promise.all([
    fetchProduct(decodeURIComponent(part_number)),
    fetchAlternatives(decodeURIComponent(part_number)),
  ])

  if (!product) notFound()

  const pn = product.part_number || part_number
  const brandName = product.brand?.name || product.manufacturer || product.brand
  const categoryName = product.category?.name || product.category

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-12">
        <nav className="text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          {categoryName && (
            <>
              <Link href={categoryToSlug(String(categoryName)) ? `/categories/${categoryToSlug(String(categoryName))}` : `/search?category=${encodeURIComponent(categoryName)}`} className="hover:text-primary-600">{categoryName}</Link>
              <span className="mx-2">/</span>
            </>
          )}
          <Link href={`/product/${encodeURIComponent(pn)}`} className="hover:text-primary-600">{pn}</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">Obsolete / Replacements</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <Link href={`/product/${encodeURIComponent(pn)}`} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to {pn}
          </Link>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-8 mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {pn} – Discontinued or Hard to Find
            </h1>
            <p className="text-slate-700 mb-4">
              {pn} may be discontinued or difficult to find. This page lists possible replacement components and suppliers.
            </p>
            <Link
              href={`/rfq?part_number=${encodeURIComponent(pn)}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold"
            >
              Request Quote / Availability
            </Link>
          </div>

          {alternatives.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Possible Replacements</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {alternatives.map((alt: any) => (
                  <Link
                    key={alt.part_number}
                    href={`/product/${encodeURIComponent(alt.part_number)}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 hover:border-primary-500 hover:shadow-md transition-all flex items-center gap-4"
                  >
                    {alt.image_url ? (
                      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                        <Image src={imageUrl(alt.image_url)} alt="" fill className="object-contain" sizes="64px" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-slate-900 truncate">{alt.part_number}</p>
                      <p className="text-sm text-slate-600 truncate">{alt.brand || alt.manufacturer || '—'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={`/product/${encodeURIComponent(pn)}`} className="text-sm text-primary-600 hover:underline">Product page</Link>
            <Link href={`/datasheet/${encodeURIComponent(pn)}`} className="text-sm text-primary-600 hover:underline">Datasheet</Link>
            <Link href={`/alternatives/${encodeURIComponent(pn)}`} className="text-sm text-primary-600 hover:underline">All alternatives</Link>
            {brandName && <Link href={getBrandHref({ name: brandName })} className="text-sm text-primary-600 hover:underline">{brandName} products</Link>}
          </div>
        </div>
      </div>
    </div>
  )
}
