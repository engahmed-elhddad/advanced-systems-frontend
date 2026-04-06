import Link from "next/link"
import { SITE_URL } from "@/app/lib/constants"
import { getProducts } from "@/lib/api"
import { ProductCard } from "@/components/products/ProductCard"
import { productToCardProps } from "@/lib/productMappers"
import type { Metadata } from "next"

export const revalidate = 300

type Props = {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ page?: string }>
}

type ProductListResponse = {
  items?: Array<Record<string, unknown>>
  products?: Array<Record<string, unknown>>
  total?: number
  page?: number
  pages?: number
}

function slugToBrand(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

async function fetchBrandProducts(brandSlug: string, page: number) {
  const brand = slugToBrand(brandSlug)
  const brandQuery = decodeURIComponent(brandSlug).trim().toLowerCase()
  if (process.env.NODE_ENV === "development") {
    // Requested debug trace for critical brand filtering issue.
    // eslint-disable-next-line no-console
    console.log("Brand param:", brandSlug)
  }
  if (!brandQuery) {
    return { items: [], total: 0, pages: 1, brand, failed: false }
  }
  try {
    const data = (await getProducts({
      brand: brandQuery,
      page,
      size: 24,
      include_unready: false,
    })) as ProductListResponse
    const items = data.items ?? data.products ?? []
    const total = data.total ?? items.length
    const pages = data.pages ?? Math.max(1, Math.ceil(total / 24))
    return { items, total, pages, brand, failed: false }
  } catch {
    return { items: [], total: 0, pages: 1, brand, failed: true }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand: brandSlug } = await params
  const brand = slugToBrand(brandSlug)
  const { items } = await fetchBrandProducts(brandSlug, 1)
  const categories = Array.from(
    new Set(
      items
        .map((item) => String(item.category ?? '').trim())
        .filter(Boolean)
    )
  ).slice(0, 5)
  const canonical = `${SITE_URL}/brand/${encodeURIComponent(brandSlug)}`
  const description = `Explore ${brand} industrial automation parts with global delivery and fast quote turnaround.`
  const keywordCombos = categories.map((cat) => `${brand} ${cat}`)
  return {
    title: `${brand} Industrial Parts | Buy Industrial Components`,
    description,
    keywords: [brand, ...keywordCombos, "industrial automation", "industrial parts", "PLC", "drives", "sensors"],
    alternates: { canonical },
    openGraph: {
      title: `${brand} Industrial Parts`,
      description,
      url: canonical,
      type: "website",
    },
  }
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { brand: brandSlug } = await params
  const { page } = await searchParams
  const currentPage = Math.max(1, Number(page) || 1)
  const { items, total, pages, brand, failed } = await fetchBrandProducts(brandSlug, currentPage)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-10">
        <nav className="mb-5 text-sm text-slate-500">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-900">{brand}</span>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900">{brand} Products</h1>
        <p className="mt-2 text-slate-600">
          Buy {brand} parts with verified sourcing, global shipping, and rapid RFQ support.
        </p>

        {failed ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
            <p className="text-amber-900 font-semibold">Having trouble loading data</p>
            <p className="mt-1 text-sm text-amber-800">Please try again or contact us instantly on WhatsApp.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Link
                href={`/brand/${brandSlug}${currentPage > 1 ? `?page=${currentPage}` : ''}`}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Try again
              </Link>
              <a
                href={`https://wa.me/201000629229?text=${encodeURIComponent(`Hello, I need help finding ${brand} parts`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                WhatsApp instantly
              </a>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-700">No products available for this brand yet.</p>
            <p className="mt-1 text-sm text-slate-500">Need a specific part from {brand}? We can source it quickly.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Link
                href={`/rfq?part_number=${encodeURIComponent(brand)}`}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
              >
                ⚡ Get Price
              </Link>
              <Link
                href="/categories"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-slate-500">
              Showing {items.length} of {total} products
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {items.map((product) => {
                const mapped = productToCardProps(product as never)
                return (
                  <ProductCard
                    key={mapped.part_number}
                    {...mapped}
                    productBasePath="/part-number"
                    variant="compact"
                  />
                )
              })}
            </div>
          </>
        )}

        {pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={`/brand/${brandSlug}?page=${currentPage - 1}`}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-white"
              >
                Previous
              </Link>
            )}
            {currentPage < pages && (
              <Link
                href={`/brand/${brandSlug}?page=${currentPage + 1}`}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600"
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
