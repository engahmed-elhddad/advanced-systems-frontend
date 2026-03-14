import { notFound } from 'next/navigation'
import Link from 'next/link'
import { slugToCategory } from '@/app/lib/constants'
import { ProductCard } from '@/components/products/ProductCard'
import { productToCardProps } from '@/lib/productMappers'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://advancedsystems-int.com'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

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

async function fetchProducts(category: string, page: number = 1, brand?: string) {
  try {
    const params = new URLSearchParams()
    params.set('q', category)
    params.set('category', category)
    params.set('limit', '24')
    if (page > 1) params.set('page', String(page))
    if (brand) params.set('brand', brand)
    const res = await fetch(`${API_BASE}/search?${params}`, { next: { revalidate: 3600 } })
    if (!res.ok) return { results: [], count: 0 }
    const data = await res.json()
    return {
      results: data.results || [],
      count: data.count ?? data.results?.length ?? 0,
    }
  } catch {
    return { results: [], count: 0 }
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageStr, brand } = await searchParams
  const categoryName = slugToCategoryName(slug)
  if (!categoryName) notFound()

  const page = Math.max(1, parseInt(pageStr || '1', 10))
  const { results, count } = await fetchProducts(categoryName, page, brand || undefined)

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
              {results.map((p) => (
                <ProductCard key={p.part_number} {...productToCardProps(p)} productBasePath="/product" />
              ))}
            </div>
            {count > 24 && (
              <div className="mt-8 flex justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/category/${slug}${page > 2 ? `?page=${page - 1}` : ''}${brand ? `&brand=${encodeURIComponent(brand)}` : ''}`}
                    className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-white text-slate-700"
                  >
                    Previous
                  </Link>
                )}
                {page * 24 < count && (
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
