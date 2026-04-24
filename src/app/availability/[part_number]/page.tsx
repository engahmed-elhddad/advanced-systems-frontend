import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Package, ArrowLeft } from 'lucide-react'
import { getProductOrGenerate } from '@/lib/api'
import { categoryToSlug } from '@/lib/constants'
import { getBrandHref } from '@/lib/brandUtils'
import { CONTACT_EMAIL, WHATSAPP_NUMBER } from '@/lib/constants'
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { part_number } = await params
  const product = await fetchProduct(decodeURIComponent(part_number))
  if (!product) return { title: 'Availability Not Found' }
  const brandName = product.brand?.name || product.manufacturer || 'Industrial'
  const pn = product.part_number || part_number
  const title = `${pn} Availability – ${brandName} | Request Stock & Pricing`
  const desc = `Looking for ${pn}? This industrial automation component may be difficult to source. Request availability and pricing from verified suppliers.`.slice(0, 160)
  const canonical = `${SITE_URL}/availability/${encodeURIComponent(pn)}`
  return {
    title,
    description: desc,
    keywords: `${pn}, availability, stock, pricing, ${brandName}, industrial automation, RFQ`.split(', ').filter(Boolean).join(', '),
    alternates: { canonical },
    openGraph: { title, description: desc, url: canonical, type: 'website' },
    twitter: { card: 'summary', title, description: desc },
    robots: { index: true, follow: true },
  }
}

export const revalidate = 3600

export default async function AvailabilityPage({ params }: Props) {
  const { part_number } = await params
  const product = await fetchProduct(decodeURIComponent(part_number))
  if (!product) notFound()

  const pn = product.part_number || part_number
  const brandName = product.brand?.name || product.manufacturer || product.brand
  const categoryName = product.category?.name || product.category
  const inStock = product.availability === 'available' || product.availability === 'in_stock' || (product.stock_quantity ?? 0) > 0
  const availabilityLabel = inStock ? 'In Stock' : product.availability === 'limited' ? 'Limited Stock' : 'Request Quote'

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
          <span className="text-slate-900 font-medium">Availability</span>
        </nav>

        <div className="max-w-2xl mx-auto">
          <Link href={`/product/${encodeURIComponent(pn)}`} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to {pn}
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{pn} Availability</h1>
                {brandName && <p className="text-slate-600 text-sm">{brandName}</p>}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 mb-6">
              <p className="text-sm font-medium text-slate-700 mb-1">Current status</p>
              <p className={`text-lg font-semibold ${inStock ? 'text-green-600' : 'text-amber-600'}`}>
                {availabilityLabel}
              </p>
            </div>

            <p className="text-slate-600 mb-6">
              Looking for {pn}? This industrial automation component may be difficult to source. Request availability and pricing from verified suppliers.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/rfq?part_number=${encodeURIComponent(pn)}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold"
              >
                <MessageCircle className="w-5 h-5" />
                Request Quote
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Availability%20for%20${encodeURIComponent(pn)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-200 hover:border-primary-500 hover:bg-primary-50 text-slate-700 font-medium"
              >
                WhatsApp
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Availability%20${encodeURIComponent(pn)}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-200 hover:border-primary-500 hover:bg-primary-50 text-slate-700 font-medium"
              >
                Email
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4">
              <Link href={`/product/${encodeURIComponent(pn)}`} className="text-sm text-primary-600 hover:underline">Product page</Link>
              <Link href={`/datasheet/${encodeURIComponent(pn)}`} className="text-sm text-primary-600 hover:underline">Datasheet</Link>
              <Link href={`/alternatives/${encodeURIComponent(pn)}`} className="text-sm text-primary-600 hover:underline">Alternatives</Link>
              {brandName && <Link href={getBrandHref({ name: brandName })} className="text-sm text-primary-600 hover:underline">{brandName} products</Link>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
