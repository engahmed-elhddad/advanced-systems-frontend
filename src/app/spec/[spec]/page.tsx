export const dynamic = "force-dynamic"

import Link from "next/link"
import { API_BASE_URL, SITE_URL, rfqMailtoHref, categoryToSlug, slugToSpec } from "@/lib/constants"
import { resolveProductImage } from "@/lib/imageResolver"
import { MailIcon } from "@/components/ui/MailIcon"
import { BrandLogo } from "@/components/ui/BrandLogo"
import { ProductImageWithFallback } from "@/components/ui/ProductImageWithFallback"

const API = API_BASE_URL

type Props = {
  params: Promise<{ spec: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { spec: specSlug } = await params
  const { key, value } = slugToSpec(specSlug)
  const label = value ? `${key}: ${value}` : key
  const url = `${SITE_URL}/spec/${specSlug}`
  return {
    title: `${label} – Industrial Parts | Advanced Systems`,
    description: `Industrial automation components with specification ${label}.`,
    alternates: { canonical: url },
    openGraph: { title: `${label} Industrial Parts`, url },
  }
}

export default async function SpecPage({ params, searchParams }: Props) {
  const { spec: specSlug } = await params
  const sp = await searchParams
  const { key: specKey, value: specValue } = slugToSpec(specSlug)
  const page = Math.max(1, Number(sp?.page) || 1)
  const size = 24

  let products: { part_number: string; manufacturer?: string; brand?: string; category?: string; images?: string[]; image_url?: string; offers?: { quantity?: number }[] }[] = []
  let fetchError = false

  try {
    const url = new URL(`${API}/api/knowledge-graph/products-by-spec`)
    url.searchParams.set("spec_key", specKey)
    if (specValue) url.searchParams.set("spec_value", specValue)
    url.searchParams.set("limit", String(size * 2))
    const res = await fetch(url.toString(), { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      products = data?.products ?? []
    } else {
      fetchError = true
    }
  } catch {
    fetchError = true
  }

  const displayLabel = specValue ? `${specKey}: ${specValue}` : specKey
  const totalPages = Math.max(1, Math.ceil(products.length / size))
  const paginatedProducts = products.slice((page - 1) * size, page * size)

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Products", item: `${SITE_URL}/products` },
      { "@type": "ListItem", position: 3, name: displayLabel, item: `${SITE_URL}/spec/${specSlug}` },
    ],
  }

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
              <li className="text-gray-900 font-medium">{displayLabel}</li>
            </ol>
          </nav>
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            SPECIFICATION
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mt-2">
            {displayLabel} – Industrial Automation Parts
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Industrial automation components with specification {displayLabel}.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {fetchError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600 font-medium">Unable to load products.</p>
          </div>
        )}

        {!fetchError && paginatedProducts.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No products found with specification {displayLabel}.</p>
            <Link href="/products" className="btn-primary">Browse All Products</Link>
          </div>
        )}

        {!fetchError && paginatedProducts.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {products.length} product{products.length !== 1 ? "s" : ""} matching {displayLabel}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {paginatedProducts.map((p) => {
                const imageSrc = resolveProductImage(p.part_number)
                const qty = p.offers?.[0]?.quantity ?? 0
                const inStock = qty > 0
                return (
                  <div key={p.part_number} className="card card-hover group flex flex-col overflow-hidden">
                    <Link href={`/products/${encodeURIComponent(p.part_number)}`} className="block relative">
                      <div className="aspect-square flex items-center justify-center p-3 bg-gray-50 border-b border-gray-100 overflow-hidden">
                        <ProductImageWithFallback
                          src={imageSrc}
                          alt={p.part_number}
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="absolute top-2 right-2">
                        {inStock ? <span className="badge-in-stock">In Stock</span> : <span className="badge-on-request">On Request</span>}
                      </div>
                    </Link>
                    <div className="flex-1 flex flex-col p-3 gap-2">
                      <BrandLogo brand={p.manufacturer || p.brand || ''} variant="square" badgeClassName="text-xs" />
                      <Link href={`/products/${encodeURIComponent(p.part_number)}`} className="font-mono font-semibold text-gray-900 text-sm hover:text-primary-600 truncate">
                        {p.part_number}
                      </Link>
                      {p.category && (
                        <Link href={`/categories/${categoryToSlug(p.category)}`} className="text-xs text-gray-500 hover:text-primary-600 truncate">
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
          </>
        )}
      </div>
    </div>
  )
}
