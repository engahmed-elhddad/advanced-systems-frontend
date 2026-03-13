export const dynamic = "force-dynamic"

import Link from "next/link"
import { API_BASE_URL, rfqMailtoHref, slugToCategory, categoryToSlug, resolveProductImageUrl } from "@/app/lib/constants"
import { MailIcon } from "@/components/ui/MailIcon"
import { BrandLogo } from "@/components/ui/BrandLogo"
import { ProductImageWithFallback } from "@/components/ui/ProductImageWithFallback"
import { BRAND_MAP, BRAND_DESCRIPTIONS } from "@/app/lib/brands"

type Props = {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ page?: string; category?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { brand: brandSlug } = await params
  const brand = BRAND_MAP[brandSlug.toLowerCase()] ?? decodeURIComponent(brandSlug).replace(/\b\w/g, (l) => l.toUpperCase())
  const url = `https://advancedsystems-int.com/brand/${brandSlug}`
  return {
    title: `${brand} Industrial Automation Parts | Advanced Systems`,
    description: `Buy ${brand} industrial automation spare parts including PLC modules, sensors, drives and control system components.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${brand} Industrial Automation Parts`,
      description: `Buy ${brand} PLC modules, sensors, drives and automation spare parts.`,
      url,
      siteName: "Advanced Systems",
      type: "website",
    },
  }
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { brand: brandSlug } = await params
  const sp = await searchParams
  const brand = BRAND_MAP[brandSlug.toLowerCase()] ?? decodeURIComponent(brandSlug).replace(/\b\w/g, (l: string) => l.toUpperCase())
  const page = Math.max(1, Number(sp.page) || 1)
  const categorySlugParam = sp.category || ""
  const category = categorySlugParam
    ? (slugToCategory(categorySlugParam) ?? categorySlugParam.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()))
    : ""

  const API = API_BASE_URL

  let products: { part_number: string; manufacturer?: string; images?: string[]; image?: string; description?: string; category?: string; quantity?: number; offers?: { quantity?: number; availability?: string }[] }[] = []
  let totalPages = 1
  let categories: string[] = []
  let fetchError = false

  try {
    let url = `${API}/api/v1/products/?brand=${encodeURIComponent(brandSlug.toLowerCase())}&page=${page}&size=20`
    if (category) url += `&category=${encodeURIComponent(category)}`
    const res = await fetch(url, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      products = data?.items ?? []
      totalPages = data?.pages ?? 1
    } else {
      fetchError = true
    }
  } catch {
    fetchError = true
  }

  try {
    const catRes = await fetch(`${API}/api/v1/categories/`, { cache: "no-store" })
    if (catRes.ok) {
      const data = await catRes.json()
      categories = (data?.categories ?? data ?? []).map((c: { name?: string }) => c.name || c).filter(Boolean)
    }
  } catch { /* ignore */ }

  const brandSchema = { "@context": "https://schema.org", "@type": "CollectionPage", name: `${brand} Industrial Automation Parts`, url: `https://advancedsystems-int.com/brand/${brandSlug}`, about: { "@type": "Brand", name: brand } }
  const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://advancedsystems-int.com" },
    { "@type": "ListItem", position: 2, name: "Products", item: "https://advancedsystems-int.com/products" },
    { "@type": "ListItem", position: 3, name: `${brand} Parts`, item: `https://advancedsystems-int.com/brand/${brandSlug}` },
  ]}

  const startPage = Math.max(1, page - 2)
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => startPage + i).filter((p) => p <= totalPages)

  function pageUrl(p: number) {
    let url = `/brand/${brandSlug}?page=${p}`
    if (categorySlugParam) url += `&category=${categorySlugParam}`
    return url
  }

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-primary-600 transition">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li><Link href="/products" className="hover:text-primary-600 transition">Products</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">{brand}</li>
            </ol>
          </nav>
          <div className="flex items-center gap-3 mb-3">
            <BrandLogo brand={brand} logoClassName="h-10 max-w-[120px]" badgeClassName="px-3 py-1 text-xs bg-primary-50 text-primary-600 border border-primary-200 rounded-lg" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            {brand} Industrial Automation Parts
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            {BRAND_DESCRIPTIONS[brand] ?? `Buy ${brand} industrial automation spare parts including PLC modules, sensors, drives and industrial control equipment.`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {categories.length > 0 && (
            <aside className="lg:w-56 shrink-0">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-soft">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Filter by Category</h2>
                <div className="flex flex-col gap-1.5">
                  <Link
                    href={`/brand/${brandSlug}`}
                    className={`px-4 py-2.5 rounded-lg text-left text-sm font-medium transition ${!categorySlugParam ? "bg-primary-500 text-white" : "text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
                  >
                    All Categories
                  </Link>
                  {categories.map((c) => {
                    const cSlug = categoryToSlug(c) ?? c.toLowerCase().replace(/\s+/g, "-")
                    return (
                      <Link
                        key={c}
                        href={`/brand/${brandSlug}?category=${cSlug}`}
                        className={`px-4 py-2.5 rounded-lg text-left text-sm font-medium transition ${categorySlugParam === cSlug ? "bg-primary-500 text-white" : "text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
                      >
                        {c.replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </aside>
          )}

          <div className="flex-1 min-w-0">
            {fetchError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 mb-6 text-center">
                <p className="text-red-600 font-medium">Unable to load products. Please try again later.</p>
              </div>
            )}

            {!fetchError && totalPages > 1 && <p className="text-sm text-gray-500 mb-4">Page {page} of {totalPages}</p>}

            {!fetchError && products.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">No products available for this brand yet.</p>
                <Link href="/products" className="btn-primary">Browse All Products</Link>
              </div>
            )}

            {!fetchError && products.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Showing {products.length} {brand} product{products.length !== 1 ? "s" : ""}
                {category ? ` in "${category}"` : ""}
                {totalPages > 1 ? ` — page ${page} of ${totalPages}` : ""}
              </p>
            )}

            {!fetchError && products.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {products.map((p) => {
                  const imageSrc = resolveProductImageUrl(p, API)
                  const rfqHref = rfqMailtoHref(p.part_number)
                  const offer = p.offers?.[0]
                  const qty = offer?.quantity ?? p.quantity ?? 0
                  const inStock = qty > 0

                  return (
                    <div key={p.part_number} className="card card-hover group flex flex-col overflow-hidden">
                      <Link href={`/product/${p.part_number}`} className="block relative">
                        <div className="aspect-square flex items-center justify-center p-3 bg-gray-50 border-b border-gray-100 overflow-hidden">
                          <ProductImageWithFallback
                            src={imageSrc}
                            alt={p.part_number}
                            className="max-h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="absolute top-2 right-2">
                          {inStock ? (
                            <span className="badge-in-stock">In Stock</span>
                          ) : (
                            <span className="badge-on-request">On Request</span>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 flex flex-col p-3 gap-2">
                        <div className="flex items-center justify-between gap-2 min-h-[20px]">
                          <BrandLogo brand={p.manufacturer || brand} badgeClassName="text-xs" />
                        </div>
                        <Link href={`/product/${p.part_number}`} className="font-mono font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition truncate" title={p.part_number}>
                          {p.part_number}
                        </Link>
                        {p.description && <p className="text-gray-500 text-xs line-clamp-2 leading-snug flex-1">{p.description}</p>}
                        <a href={rfqHref} className="mt-auto inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition">
                          <MailIcon /> Request Quote
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {!fetchError && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
                {page > 1 && <Link href={pageUrl(page - 1)} className="btn-secondary px-4 py-2">Prev</Link>}
                {pages.map((p) => (
                  <Link key={p} href={pageUrl(p)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${page === p ? "bg-primary-500 text-white" : "btn-secondary"}`}>{p}</Link>
                ))}
                {page < totalPages && <Link href={pageUrl(page + 1)} className="btn-secondary px-4 py-2">Next</Link>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
