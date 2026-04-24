import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, Download, ExternalLink, ArrowLeft, Package } from 'lucide-react'
import { categoryToSlug } from '@/lib/constants'
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
    const res = await fetch(`${API_BASE}/product/${encodeURIComponent(partNumber)}/cross-references?limit=6`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data?.alternatives ?? []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { part_number } = await params
  const product = await fetchProduct(decodeURIComponent(part_number))
  if (!product) return { title: 'Datasheet Not Found' }

  const brandName = product.manufacturer || product.brand || 'Industrial'
  const categoryName = product.category || 'Industrial Automation'
  const pn = product.part_number || part_number
  const title = `${pn} Datasheet PDF – ${brandName} | Technical Specifications`
  const desc = `Download ${pn} datasheet PDF. ${brandName} ${categoryName}. Technical specifications, dimensions, wiring diagrams, and application data. Free datasheet download.`

  const canonical = `${SITE_URL}/datasheet/${encodeURIComponent(pn)}`

  return {
    title,
    description: desc.slice(0, 160),
    keywords: `${pn}, datasheet, PDF, ${brandName}, ${categoryName}, technical specifications, dimensions, wiring diagram`.split(', ').filter(Boolean).join(', '),
    alternates: { canonical },
    openGraph: {
      title,
      description: desc.slice(0, 160),
      url: canonical,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description: desc.slice(0, 160) },
    robots: { index: true, follow: true },
  }
}

export const revalidate = 3600

function SpecsTable({ specs }: { specs: Record<string, unknown> }) {
  const entries = Object.entries(specs).filter(([, v]) => v != null && String(v).trim() !== '')
  if (entries.length === 0) return null
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Parameter</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-2.5 text-slate-600">{key.replace(/_/g, ' ')}</td>
              <td className="px-4 py-2.5 font-medium text-slate-900">{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function DatasheetPage({ params }: Props) {
  const { part_number } = await params
  const [product, alternatives] = await Promise.all([
    fetchProduct(decodeURIComponent(part_number)),
    fetchAlternatives(decodeURIComponent(part_number)),
  ])
  if (!product) notFound()

  const pn = product.part_number || part_number
  const brandName = product.manufacturer || product.brand
  const categoryName = product.category
  const datasheetUrl = product.datasheet_url || (typeof product.datasheet === 'string' ? product.datasheet : product.datasheet?.[0])
  const hasPdf = Boolean(datasheetUrl)

  const fullDatasheetUrl = datasheetUrl
    ? datasheetUrl.startsWith('http')
      ? datasheetUrl
      : `${API_BASE}${datasheetUrl}`
    : null

  const specs = product.specifications && typeof product.specifications === 'object'
    ? product.specifications as Record<string, unknown>
    : product.specifications && typeof product.specifications === 'string'
      ? (() => { try { return JSON.parse(product.specifications) as Record<string, unknown> } catch { return {} } })()
      : {}

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: pn, item: `${SITE_URL}/product/${encodeURIComponent(pn)}` },
      { '@type': 'ListItem', position: 4, name: 'Datasheet', item: `${SITE_URL}/datasheet/${encodeURIComponent(pn)}` },
    ],
  }

  const techArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${pn} Datasheet – Technical Specifications`,
    description: `Technical datasheet for ${brandName || ''} ${pn}. Download PDF, view specifications.`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/datasheet/${encodeURIComponent(pn)}` },
    author: { '@type': 'Organization', name: brandName || 'Manufacturer' },
    about: { '@type': 'Product', name: pn, brand: brandName ? { '@type': 'Brand', name: brandName } : undefined },
    isPartOf: { '@type': 'WebPage', name: `${pn} Product`, url: `${SITE_URL}/product/${encodeURIComponent(pn)}` },
    ...(fullDatasheetUrl && {
      associatedMedia: { '@type': 'MediaObject', contentUrl: fullDatasheetUrl, encodingFormat: 'application/pdf' },
    }),
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleSchema) }} />

      <div className="page-container py-8">
        <nav className="text-sm text-slate-500 mb-6">
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
          <span className="text-slate-900 font-medium">Datasheet</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Header + Download */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{pn} Datasheet</h1>
                  {brandName && <p className="text-slate-600 font-medium">{brandName}</p>}
                  {categoryName && <p className="text-sm text-slate-500">{categoryName}</p>}
                </div>
              </div>

              {hasPdf ? (
                <>
                  <p className="text-slate-600 mb-4">
                    Technical datasheet for {pn}. Includes specifications, dimensions, wiring diagrams, and application notes.
                  </p>
                  <p className="text-slate-500 text-sm mb-4">
                    This page provides specifications and datasheet for the industrial component {pn}. If this part is difficult to source, you can request a quote from our suppliers.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={fullDatasheetUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Download PDF
                    </a>
                    <a
                      href={fullDatasheetUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-200 hover:border-primary-500 hover:bg-primary-50 text-slate-700 font-medium transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Open in New Tab
                    </a>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                  <p className="text-amber-800 font-medium mb-2">Datasheet not yet available</p>
                  <p className="text-amber-700 text-sm mb-4">
                    We&apos;re sourcing the datasheet for {pn}. Request a quote and our team can provide technical documentation.
                  </p>
                  <Link
                    href={`/rfq?part_number=${encodeURIComponent(pn)}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium"
                  >
                    Request Quote & Datasheet
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-200">
                <Link
                  href={`/product/${encodeURIComponent(pn)}`}
                  className="inline-flex items-center gap-2 text-primary-600 hover:underline font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  View full product page
                </Link>
                <span className="mx-3 text-slate-300">|</span>
                <Link href={`/alternatives/${encodeURIComponent(pn)}`} className="text-primary-600 hover:underline font-medium">
                  View alternatives
                </Link>
              </div>
            </div>

            {/* PDF Viewer */}
            {hasPdf && fullDatasheetUrl && (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 px-6 py-4 border-b border-slate-200">Datasheet Preview</h2>
                <div className="aspect-[4/3] min-h-[400px] bg-slate-100">
                  <iframe
                    src={`${fullDatasheetUrl}#view=FitH`}
                    title={`${pn} datasheet`}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Technical Specifications */}
            {Object.keys(specs).length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 px-6 py-4 border-b border-slate-200">Technical Specifications</h2>
                <div className="p-6">
                  <SpecsTable specs={specs} />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Product summary + Alternatives */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
              <Link href={`/products/${encodeURIComponent(pn)}`} className="block group">
                <div className="flex gap-4">
                  {product.image_url ? (
                    <div className="relative w-20 h-20 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
                      <Image
                        src={product.image_url.startsWith('http') ? product.image_url : `${API_BASE}${product.image_url}`}
                        alt={pn}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Package className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-mono font-semibold text-slate-900 group-hover:text-primary-600">{pn}</span>
                    {brandName && <p className="text-sm text-slate-500">{brandName}</p>}
                    <span className="text-sm text-primary-600 font-medium">View product →</span>
                  </div>
                </div>
              </Link>
              <Link
                href={`/rfq?part_number=${encodeURIComponent(pn)}`}
                className="mt-4 block w-full text-center py-2.5 rounded-lg border border-primary-500 text-primary-600 hover:bg-primary-50 font-medium text-sm"
              >
                Request Quote
              </Link>
            </div>

            {alternatives.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-4">Alternative Components</h3>
                <div className="space-y-3">
                  {alternatives.slice(0, 5).map((alt: { part_number?: string; brand?: string; category?: string }) => (
                    <Link
                      key={alt.part_number}
                      href={`/product/${encodeURIComponent(alt.part_number!)}`}
                      className="block py-2 border-b border-slate-100 last:border-0 hover:text-primary-600"
                    >
                      <span className="font-mono font-medium">{alt.part_number}</span>
                      {alt.brand && <span className="text-slate-500 text-sm ml-2">{alt.brand}</span>}
                    </Link>
                  ))}
                </div>
                <Link href={`/alternatives/${encodeURIComponent(pn)}`} className="mt-3 inline-block text-sm text-primary-600 hover:underline font-medium">
                  View all alternatives →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
