export const dynamic = "force-dynamic"

import Link from "next/link"

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

/** Convert a slug like "safety-relay" → display name "Safety Relay" */
function slugToName(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function resolveImage(p) {
  const rawImg =
    (p.images && p.images.length > 0 ? p.images[0] : null) ?? p.image ?? null
  if (typeof rawImg === "string" && rawImg) {
    if (rawImg.startsWith("http")) return rawImg
    if (rawImg.startsWith("/uploads/") || rawImg.startsWith("uploads/"))
      return `${API}/${rawImg.replace(/^\//, "")}`
    if (rawImg.startsWith("/products/")) return rawImg
    // Bare filename stored by image-enrichment service
    return `${API}/uploads/products/${rawImg}`
  }
  return `${API}/uploads/products/${p.part_number}.jpg`
}

export async function generateMetadata({ params }) {
  const { category: slug } = await params
  const name = slugToName(slug)
  const url = `https://advancedsystems-int.com/category/${slug}`
  return {
    title: `${name} Industrial Automation Parts | Advanced Systems`,
    description: `Buy ${name} industrial automation components including PLC modules, sensors, drives and control equipment from Advanced Systems.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} Industrial Automation Parts`,
      description: `Buy ${name} PLC modules, sensors, drives and automation spare parts.`,
      url,
      siteName: "Advanced Systems",
      type: "website",
    },
  }
}

export default async function CategoryPage({ params, searchParams }) {
  const { category: slug } = await params
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page) || 1)
  const categoryName = slugToName(slug)

  let products = []
  let totalPages = 1
  let fetchError = false

  try {
    const res = await fetch(
      `${API}/products?page=${page}&category=${encodeURIComponent(categoryName)}`,
      { cache: "no-store" }
    )
    if (res.ok) {
      const data = await res.json()
      products = data?.results ?? []
      totalPages = data?.total_pages ?? 1
    } else {
      fetchError = true
    }
  } catch {
    fetchError = true
  }

  const startPage = Math.max(1, page - 2)
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => startPage + i).filter(
    (p) => p <= totalPages
  )

  function pageUrl(p) {
    return `/category/${slug}?page=${p}`
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://advancedsystems-int.com" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://advancedsystems-int.com/products" },
      { "@type": "ListItem", position: 3, name: categoryName, item: `https://advancedsystems-int.com/category/${slug}` },
    ],
  }

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} Industrial Automation Parts`,
    url: `https://advancedsystems-int.com/category/${slug}`,
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #060d1a 0%, #0a0f1a 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="text-sm text-slate-400 mb-4" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-sky-400 transition">Home</Link></li>
              <li className="text-slate-600">/</li>
              <li><Link href="/products" className="hover:text-sky-400 transition">Products</Link></li>
              <li className="text-slate-600">/</li>
              <li className="text-white font-medium">{categoryName}</li>
            </ol>
          </nav>
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase tracking-wider">
              {categoryName}
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {categoryName} Industrial Automation Parts
          </h1>
          <p className="mt-2 text-slate-300 max-w-2xl">
            Browse {categoryName} industrial automation components from Advanced Systems including PLC modules, sensors, drives and control equipment.
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

        {!fetchError && totalPages > 1 && (
          <p className="text-sm text-slate-400 mb-4">Page {page} of {totalPages}</p>
        )}

        {!fetchError && products.length === 0 && (
          <div className="rounded-2xl border border-[#1e2d4f] bg-[#131d35] p-12 text-center">
            <p className="text-slate-400 text-lg mb-4">
              No products found in <strong className="text-white">{categoryName}</strong>.
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
              const imageSrc = resolveImage(p)
              const offer = p.offers?.[0]
              const qty = offer?.quantity ?? 0

              return (
                <div
                  key={p.part_number}
                  className="group flex flex-col rounded-xl border border-[#1e2d4f] bg-[#131d35] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10"
                >
                  <Link href={`/product/${p.part_number}`} className="block relative">
                    <div className="aspect-square flex items-center justify-center p-3 bg-[#0f1629] overflow-hidden">
                      <img
                        src={imageSrc}
                        alt={p.part_number}
                        loading="lazy"
                        className="max-h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.currentTarget.src = "/products/no-product-image.jpg" }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-[#0a0f1a]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white text-xs font-semibold tracking-wider uppercase bg-sky-500/90 px-4 py-2 rounded-lg">
                        Quick View
                      </span>
                    </div>
                  </Link>
                  <div className="flex-1 flex flex-col p-3">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] uppercase text-sky-400/70 tracking-widest font-medium truncate">
                        {p.manufacturer || "Industrial"}
                      </span>
                      {(qty > 0 || offer?.availability) && (
                        <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                          qty > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {qty > 0 ? "In Stock" : "On Request"}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/product/${p.part_number}`}
                      className="text-sky-300 font-bold text-sm mt-0.5 truncate hover:text-sky-200 transition"
                    >
                      {p.part_number}
                    </Link>
                    {p.description && (
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-snug flex-1">
                        {p.description}
                      </p>
                    )}
                    <a
                      href={`mailto:eng.ahmed@advancedsystems-int.com?subject=RFQ%20${encodeURIComponent(p.part_number)}`}
                      className="mt-2 inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition"
                    >
                      Request Quote
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!fetchError && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
            {page > 1 && (
              <Link
                href={pageUrl(page - 1)}
                className="px-4 py-2 rounded-lg bg-[#131d35] border border-[#1e2d4f] hover:bg-[#1e2d4f] text-slate-300 text-sm font-medium transition"
              >
                Prev
              </Link>
            )}
            {pages.map((p) => (
              <Link
                key={p}
                href={pageUrl(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  page === p
                    ? "bg-sky-500 text-white"
                    : "bg-[#131d35] border border-[#1e2d4f] hover:bg-[#1e2d4f] text-slate-300"
                }`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={pageUrl(page + 1)}
                className="px-4 py-2 rounded-lg bg-[#131d35] border border-[#1e2d4f] hover:bg-[#1e2d4f] text-slate-300 text-sm font-medium transition"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
