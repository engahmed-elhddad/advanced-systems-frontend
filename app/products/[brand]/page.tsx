export const dynamic = "force-dynamic"

import Link from "next/link"
import { API_BASE_URL, rfqMailtoHref, resolveProductImageUrl } from "@/app/lib/constants"
import { MailIcon } from "@/components/ui/MailIcon"

/* =========================
SEO METADATA
========================= */

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: brandSlug } = await params
  const brand = decodeURIComponent(brandSlug).replace(/\b\w/g, (l) => l.toUpperCase())
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

/* =========================
PAGE
========================= */

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: brandSlug } = await params
  const brand = decodeURIComponent(brandSlug).replace(/\b\w/g, (l) => l.toUpperCase())

  const API = API_BASE_URL

  let products: { part_number: string; manufacturer?: string; images?: string[]; image?: string; description?: string }[] = []
  let fetchError = false

  try {
    const res = await fetch(
      `${API}/brand/${encodeURIComponent(brand)}?page=1`,
      { cache: "no-store" }
    )
    if (res.ok) {
      const data = await res.json()
      products = data?.results ?? []
    } else {
      fetchError = true
    }
  } catch (e) {
    console.error("brand page error", e)
    fetchError = true
  }

  /* =========================
  SCHEMA
  ========================= */

  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brand} Industrial Automation Parts`,
    url: `https://advancedsystems-int.com/brand/${brandSlug}`,
    about: { "@type": "Brand", name: brand },
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }}
      />

      {/* ── Brand banner ── */}
      <div style={{ background: "linear-gradient(135deg, #060d1a 0%, #0a0f1a 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="text-sm text-slate-400 mb-4" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-sky-400 transition">Home</Link></li>
              <li className="text-slate-600">/</li>
              <li><Link href="/products" className="hover:text-sky-400 transition">Products</Link></li>
              <li className="text-slate-600">/</li>
              <li className="text-white font-medium">{brand}</li>
            </ol>
          </nav>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {brand} Industrial Automation Parts
          </h1>
          <p className="mt-2 text-slate-300 max-w-2xl">
            Buy {brand} industrial automation spare parts including PLC modules, sensors, drives and industrial control equipment.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {fetchError && (
          <div className="rounded-2xl border border-red-500/30 bg-[#131d35] p-6 mb-6 text-center">
            <p className="text-red-400 font-medium">
              Unable to load products at this time. Please try again later.
            </p>
          </div>
        )}

        {!fetchError && products.length === 0 && (
          <div className="rounded-2xl border border-[#1e2d4f] bg-[#131d35] p-12 text-center">
            <p className="text-slate-400 text-lg mb-4">
              No products found for <strong className="text-white">{brand}</strong>.
            </p>
            <Link
              href="/products"
              className="inline-flex px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium transition"
            >
              Browse All Products
            </Link>
          </div>
        )}

        {!fetchError && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((p) => {
              const imageSrc = resolveProductImageUrl(p, API)
              const rfqHref = rfqMailtoHref(p.part_number)
              return (
                <div
                  key={p.part_number}
                  className="card-hover group flex flex-col rounded-xl border border-[#1e2d4f] bg-[#131d35] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/10"
                >
                  <Link href={`/product/${p.part_number}`} className="block relative">
                    <div className="aspect-square flex items-center justify-center p-3 bg-[#0f1629] border-b border-[#1e2d4f] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc}
                        alt={p.part_number}
                        loading="lazy"
                        className="max-h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/products/no-product-image.jpg"
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-[#0a0f1a]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white text-xs font-semibold tracking-wider uppercase bg-sky-500/90 px-4 py-2 rounded-lg">
                        Quick View
                      </span>
                    </div>
                  </Link>
                  <div className="flex-1 flex flex-col p-3 gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 truncate max-w-full">
                      {p.manufacturer || brand}
                    </span>
                    <Link
                      href={`/product/${p.part_number}`}
                      className="text-sky-300 font-bold text-sm truncate hover:text-sky-200 transition"
                      title={p.part_number}
                    >
                      {p.part_number}
                    </Link>
                    {p.description && (
                      <p className="text-slate-400 text-xs line-clamp-2 leading-snug flex-1">
                        {p.description}
                      </p>
                    )}
                    <a
                      href={rfqHref}
                      className="mt-auto inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white text-xs font-semibold transition-all duration-200 hover:shadow-md hover:shadow-sky-500/30"
                    >
                      <MailIcon />
                      Request Quote
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
