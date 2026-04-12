import { notFound } from 'next/navigation'
import Link from 'next/link'
import { slugToCategory } from '@/lib/constants'
import { ProductCard } from '@/components/products/ProductCard'
import { productToCardProps } from '@/lib/productMappers'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://advancedsystems-int.com'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/** When slug is "drives", products are fetched from these DB category values (merged). */
const DRIVES_CATEGORY_ALIASES = ['Drives', 'VFD', 'Variable Frequency Drive'] as const
const PER_PAGE = 24

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; brand?: string }>
}

function slugToCategoryName(slug: string): string | undefined {
  const fromConst = slugToCategory(slug)
  if (fromConst) return fromConst
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const categoryName = slugToCategoryName(slug)
  if (!categoryName) return { title: 'Category Not Found' }
  const title = `${categoryName} – Industrial Automation Components | Advanced Systems`
  const desc = `Browse ${categoryName} from leading manufacturers. Specifications, datasheets and RFQ for industrial automation components.`.slice(0, 160)
  const canonical = `${SITE_URL}/category/${slug}`
  return {
    title,
    description: desc,
    keywords: `${categoryName}, industrial automation, components, specifications, datasheet, RFQ`.split(', ').join(', '),
    alternates: { canonical },
    openGraph: { title, description: desc, url: canonical, type: 'website' },
    robots: { index: true, follow: true },
  }
}

export const revalidate = 3600

async function fetchProducts(
  category: string,
  page: number = 1,
  brand?: string,
  limit: number = PER_PAGE
) {
  try {
    const v1 = new URLSearchParams({
      category,
      page: String(page),
      size: String(limit),
    })
    if (brand) v1.set('brand', brand)
    let res = await fetch(`${API_BASE}/api/v1/search/?${v1}`, { next: { revalidate: 3600 } })
    if (!res.ok) {
      const leg = new URLSearchParams({
        category,
        limit: String(limit),
        page: String(page),
      })
      if (brand) leg.set('brand', brand)
      res = await fetch(`${API_BASE}/products?${leg}`, { next: { revalidate: 3600 } })
    }
    if (!res.ok) return { results: [], count: 0 }
    const data = await res.json()
    const results = data.hits ?? data.items ?? data.products ?? data.results ?? []
    return {
      results,
      count: data.total ?? data.count ?? results.length,
    }
  } catch {
    return { results: [], count: 0 }
  }
}

/** Fetch products for "drives" by querying Drives, VFD, and Variable Frequency Drive; merge and dedupe by part_number. */
async function fetchDrivesProducts(page: number, brand?: string) {
  const limitPerCategory = 200
  const [r1, r2, r3] = await Promise.all(
    DRIVES_CATEGORY_ALIASES.map((cat) =>
      fetchProducts(cat, 1, brand, limitPerCategory)
    )
  )
  const byPartNumber = new Map<string, Record<string, unknown>>()
  for (const r of [r1.results, r2.results, r3.results]) {
    for (const p of r) {
      const key = String(p.part_number ?? '')
      if (key && !byPartNumber.has(key)) byPartNumber.set(key, p)
    }
  }
  const merged = Array.from(byPartNumber.values())
  const count = merged.length
  const start = (page - 1) * PER_PAGE
  const results = merged.slice(start, start + PER_PAGE)
  return { results, count }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageStr, brand } = await searchParams
  const categoryName = slugToCategoryName(slug)
  if (!categoryName) notFound()

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[CategoryPage] category=%s slug=%s brand=%s', categoryName, slug, brand || '(none)')
  }

  const page = Math.max(1, parseInt(pageStr || '1', 10))
  const { results, count } =
    slug === 'drives'
      ? await fetchDrivesProducts(page, brand || undefined)
      : await fetchProducts(categoryName, page, brand || undefined)

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
            Industrial automation components in the {categoryName} category. Browse specifications, datasheets and request quotes.
          </p>
        </div>

        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((p: Record<string, unknown>) => (
                <ProductCard key={String(p.part_number ?? '')} {...productToCardProps(p as never)} productBasePath="/products" />
              ))}
            </div>
            {count > PER_PAGE && (
              <div className="mt-8 flex justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/category/${slug}${page > 2 ? `?page=${page - 1}` : ''}${brand ? `&brand=${encodeURIComponent(brand)}` : ''}`}
                    className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-white text-slate-700"
                  >
                    Previous
                  </Link>
                )}
                {page * PER_PAGE < count && (
                  <Link
                    href={`/category/${slug}?page=${page + 1}${brand ? `&brand=${encodeURIComponent(brand)}` : ''}`}
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
            <p className="text-slate-600 mb-4">No products found in this category yet.</p>
            <Link href="/search" className="text-primary-600 font-medium hover:underline">Search all products</Link>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Browse <Link href="/products" className="text-primary-600 hover:underline">all products</Link> or use{' '}
            <Link href="/product-finder" className="text-primary-600 hover:underline">Product Finder</Link> to filter by specifications.
          </p>
        </div>
      </div>
    </div>
  )
}
