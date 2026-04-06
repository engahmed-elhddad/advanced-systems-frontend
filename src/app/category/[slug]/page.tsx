import Link from 'next/link'
import { notFound } from 'next/navigation'
import { slugToCategory, SITE_URL } from '@/app/lib/constants'
import { getProducts } from '@/lib/api'
import { ProductCard } from '@/components/products/ProductCard'
import { productToCardProps } from '@/lib/productMappers'
import type { Metadata } from 'next'

const PER_PAGE = 24

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; brand?: string }>
}

function slugToCategoryName(slug: string): string | undefined {
  const fromConst = slugToCategory(slug)
  if (fromConst) return fromConst
  return decodeURIComponent(slug).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const categoryName = slugToCategoryName(slug)
  if (!categoryName) return { title: 'Category Not Found' }
  const { items } = await fetchCategoryProducts(decodeURIComponent(slug), 1)
  const brands = Array.from(
    new Set(
      items
        .map((item: Record<string, unknown>) => String(item.brand ?? '').trim())
        .filter(Boolean)
    )
  ).slice(0, 5)
  const title = `${categoryName} | Industrial Parts Marketplace`
  const description = `Browse ${categoryName} industrial components with specs, delivery options, and quick RFQ support.`
  const canonical = `${SITE_URL}/categories/${slug}`
  const keywordCombos = brands.map((brand) => `${brand} ${categoryName}`)
  return {
    title,
    description,
    keywords: [categoryName, ...keywordCombos, 'industrial automation', 'industrial parts', 'PLC', 'sensors', 'drives'],
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
    robots: { index: true, follow: true },
  }
}

export const revalidate = 300

async function fetchCategoryProducts(categoryQuery: string, page: number, brand?: string) {
  try {
    const data = await getProducts({
      category: categoryQuery,
      brand,
      page,
      size: PER_PAGE,
      include_unready: false,
    })
    const raw = data.items ?? data.products ?? []
    const items = Array.isArray(raw) ? raw : []
    const total = typeof data.total === "number" ? data.total : items.length
    const pages = data.pages ?? Math.max(1, Math.ceil(total / PER_PAGE))
    return { items, total, pages, failed: false }
  } catch {
    return { items: [], total: 0, pages: 1, failed: true }
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageStr, brand } = await searchParams
  const categoryName = slugToCategoryName(slug)
  if (!categoryName) return notFound()

  const page = Math.max(1, parseInt(pageStr || '1', 10))
  const { items, total, pages, failed } = await fetchCategoryProducts(decodeURIComponent(slug), page, brand || undefined)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-10">
        <nav className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/categories" className="hover:text-primary-600">Categories</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">{categoryName}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{categoryName}</h1>
          <p className="text-slate-600">
            Discover {categoryName} products with datasheets, availability, and fast RFQ support.
          </p>
        </div>

        {failed ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
            <p className="text-amber-900 font-semibold">Having trouble loading data</p>
            <p className="mt-1 text-sm text-amber-800">Please try again or contact us instantly on WhatsApp.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Link
                href={`/categories/${slug}${page > 1 ? `?page=${page}` : ''}${brand ? `${page > 1 ? '&' : '?'}brand=${encodeURIComponent(brand)}` : ''}`}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Try again
              </Link>
              <a
                href={`https://wa.me/201000629229?text=${encodeURIComponent(`Hello, I need help finding ${categoryName} parts`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                WhatsApp instantly
              </a>
            </div>
          </div>
        ) : items.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-slate-500">
              Showing {items.length} of {total} products
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((p: Record<string, unknown>) => (
                <ProductCard key={String(p.part_number ?? '')} {...productToCardProps(p as never)} productBasePath="/part-number" />
              ))}
            </div>
            {pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/categories/${slug}${page > 2 ? `?page=${page - 1}` : ''}${brand ? `&brand=${encodeURIComponent(brand)}` : ''}`}
                    className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-white text-slate-700"
                  >
                    Previous
                  </Link>
                )}
                {page < pages && (
                  <Link
                    href={`/categories/${slug}?page=${page + 1}${brand ? `&brand=${encodeURIComponent(brand)}` : ''}`}
                    className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-700 mb-1">No products found in this category yet.</p>
            <p className="text-sm text-slate-500">Try a nearby category or request a quote for the exact part number.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Link
                href={`/rfq?part_number=${encodeURIComponent(categoryName)}`}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
              >
                ⚡ Get Price
              </Link>
              <Link href="/search" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Search all products
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
