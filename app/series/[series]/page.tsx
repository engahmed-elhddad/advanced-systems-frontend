export const dynamic = "force-dynamic"

import Link from "next/link"
import { API_BASE_URL, SITE_URL, rfqMailtoHref, categoryToSlug } from "@/app/lib/constants"
import { resolveProductImage } from "@/lib/imageResolver"
import { MailIcon } from "@/components/ui/MailIcon"
import { BrandLogo } from "@/components/ui/BrandLogo"
import { ProductImageWithFallback } from "@/components/ui/ProductImageWithFallback"

const API = API_BASE_URL

/** Convert URL slug to series display name */
function slugToSeries(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

type Props = {
  params: Promise<{ series: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { series: seriesSlug } = await params
  const series = slugToSeries(seriesSlug)
  const url = `${SITE_URL}/series/${seriesSlug}`
  return {
    title: `${series} Series – Industrial Automation Parts | Advanced Systems`,
    description: `Buy ${series} series industrial automation components including PLCs, drives, sensors and control systems.`,
    alternates: { canonical: url },
    openGraph: { title: `${series} Series`, url },
  }
}

export default async function SeriesPage({ params, searchParams }: Props) {
  const { series: seriesSlug } = await params
  const sp = await searchParams
  const series = slugToSeries(seriesSlug)
  const page = Math.max(1, Number(sp?.page) || 1)
  const size = 24

  let products: { part_number: string; manufacturer?: string; brand?: string; category?: string; description?: string; images?: string[]; image_url?: string; offers?: { quantity?: number }[] }[] = []
  let totalPages = 1
  let fetchError = false

  try {
    const params = new URLSearchParams({
      q: "",
      series: series,
      page: page.toString(),
      limit: String(size),
    })
    const res = await fetch(`${API}/search?${params}`, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      products = data?.results ?? data?.products ?? []
      const total = data?.total ?? data?.count ?? products.length
      totalPages = Math.max(1, Math.ceil(total / size))
    } else {
      fetchError = true
    }
  } catch {
    fetchError = true
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Products", item: `${SITE_URL}/products` },
      { "@type": "ListItem", position: 3, name: `${series} Series`, item: `${SITE_URL}/series/${seriesSlug}` },
    ],
  }

  const startPage = Math.max(1, page - 2)
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => startPage + i).filter((p) => p <= totalPages)

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-primary-600 transition">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li><Link href="/products" className="hover:text-primary-600 transition">Products</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">{series} Series</li>
            </ol>
          </nav>
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 border border-primary-200">
            SERIES
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mt-2">
            {series} Industrial Automation Series
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Industrial automation components from the {series} series including PLC modules, drives, sensors and control systems.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {fetchError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600 font-medium">Unable to load products. Please try again later.</p>
          </div>
        )}

        {!fetchError && products.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No products found in the {series} series.</p>
            <Link href="/products" className="btn-primary">Browse All Products</Link>
          </div>
        )}

        {!fetchError && products.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {products.length} product{products.length !== 1 ? "s" : ""} in {series} series
              {totalPages > 1 && ` — page ${page} of ${totalPages}`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((p) => {
                const imageSrc = resolveProductImage(p.part_number)
                const qty = p.offers?.[0]?.quantity ?? 0
                const inStock = qty > 0
                return (
                  <div key={p.part_number} className="card card-hover group flex flex-col overflow-hidden">
                    <Link href={`/product/${p.part_number}`} className="block relative">
                      <div className="aspect-square flex items-center justify-center p-3 bg-gray-50 border-b border-gray-100 overflow-hidden">
                        <ProductImageWithFallback src={imageSrc} alt={p.part_number} className="max-h-full w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="absolute top-2 right-2">
                        {inStock ? <span className="badge-in-stock">In Stock</span> : <span className="badge-on-request">On Request</span>}
                      </div>
                    </Link>
                    <div className="flex-1 flex flex-col p-3 gap-2">
                      <BrandLogo brand={p.manufacturer || p.brand || ''} badgeClassName="text-xs" />
                      <Link href={`/product/${p.part_number}`} className="font-mono font-semibold text-gray-900 text-sm hover:text-primary-600 truncate">
                        {p.part_number}
                      </Link>
                      {p.category && (
                        <Link href={`/category/${categoryToSlug(p.category)}`} className="text-xs text-gray-500 hover:text-primary-600 truncate">
                          {p.category}
                        </Link>
                      )}
                      <a href={rfqMailtoHref(p.part_number)} className="mt-auto inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold">
                        <MailIcon /> Request Quote
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10 flex-wrap">
                {page > 1 && <Link href={`/series/${seriesSlug}?page=${page - 1}`} className="btn-secondary px-4 py-2">Prev</Link>}
                {pages.map((p) => (
                  <Link key={p} href={`/series/${seriesSlug}?page=${p}`} className={`px-4 py-2 rounded-lg text-sm font-medium ${page === p ? "bg-primary-500 text-white" : "btn-secondary"}`}>{p}</Link>
                ))}
                {page < totalPages && <Link href={`/series/${seriesSlug}?page=${page + 1}`} className="btn-secondary px-4 py-2">Next</Link>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
