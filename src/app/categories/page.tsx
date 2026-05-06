import Link from 'next/link'
import { Package } from 'lucide-react'
import { getCategories } from '@/lib/api'
import { API_BASE_URL } from '@/lib/constants'
import { CATEGORIES } from '@/lib/constants'

/** DB category values merged under the "Drives" slug (counts summed on categories page). */
const DRIVES_CATEGORY_ALIASES = ['Drives', 'VFD', 'Variable Frequency Drive']

export const metadata = {
  /** Root layout uses template `%s | Advanced Systems` — do not append the site name here. */
  title: 'Product Categories',
  description: 'Browse industrial automation parts by category: PLC, drives, sensors, HMI, and more.',
}

async function getCategoryProductCountByName(categoryName: string): Promise<number> {
  try {
    const sp = new URLSearchParams({
      category: categoryName,
      page: '1',
      size: '1',
    })
    let res = await fetch(`${API_BASE_URL}/api/v1/search/?${sp.toString()}`, { cache: 'no-store' })
    if (!res.ok) {
      res = await fetch(
        `${API_BASE_URL}/products?category=${encodeURIComponent(categoryName)}&limit=1`,
        { cache: 'no-store' }
      )
    }
    if (!res.ok) return 0
    const data = await res.json()
    return (
      data?.total ??
      data?.count ??
      (Array.isArray(data?.products) ? data.products.length : 0) ??
      (Array.isArray(data?.items) ? data.items.length : 0) ??
      0
    )
  } catch {
    return 0
  }
}

/** Relational catalog total — preferred when `category_id` is known (matches storefront filters). */
async function getCategoryProductCountById(categoryId: number): Promise<number> {
  try {
    const sp = new URLSearchParams({
      page: '1',
      size: '1',
      category_id: String(categoryId),
    })
    const res = await fetch(`${API_BASE_URL}/api/v1/products/?${sp}`, { cache: 'no-store' })
    if (!res.ok) return 0
    const data = await res.json()
    return typeof data?.total === 'number' ? data.total : 0
  } catch {
    return 0
  }
}

/** Count for "Drives" = sum of products in Drives, VFD, and Variable Frequency Drive (no double-count). */
async function getDrivesProductCount(): Promise<number> {
  const counts = await Promise.all(
    DRIVES_CATEGORY_ALIASES.map((cat) => getCategoryProductCountByName(cat))
  )
  return counts.reduce((a, b) => a + b, 0)
}

type CategoryRow = { name: string; slug?: string; id?: number; image_url?: string | null }

export default async function CategoriesPage() {
  let apiCategories: CategoryRow[] = []
  try {
    const data = await getCategories()
    const raw = Array.isArray(data) ? data : data?.categories || []
    apiCategories = raw.map((c: { name?: string; slug?: string; id?: number; image_url?: string | null }) => ({
      name: String(c?.name ?? ''),
      slug: c?.slug,
      id: typeof c?.id === 'number' ? c.id : undefined,
      image_url: c?.image_url ?? null,
    }))
  } catch {}
  const baseCategories: CategoryRow[] =
    apiCategories.length > 0
      ? apiCategories
      : CATEGORIES.map((c) => ({ name: c.name, slug: c.slug }))

  const categories = await Promise.all(
    baseCategories.map(async (cat) => {
      let count: number
      if (cat.slug === 'drives') {
        count = await getDrivesProductCount()
      } else if (typeof cat.id === 'number' && cat.id > 0) {
        count = await getCategoryProductCountById(cat.id)
      } else {
        count = await getCategoryProductCountByName(cat.name)
      }
      return { name: cat.name, slug: cat.slug, image_url: cat.image_url, product_count: count }
    })
  )

  return (
    <div className="relative min-h-screen pb-16 pt-6 sm:pt-10">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[240px] w-[min(100%,640px)] -translate-x-1/2 rounded-full bg-orange-500/12 blur-[100px]"
        aria-hidden
      />
      <div className="border-b border-[--border] bg-[--bg-elevated] px-4 py-12 backdrop-blur-xl sm:py-14">
        <div className="page-container">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-[--text-primary] sm:text-4xl">
            Product Categories
          </h1>
          <p className="max-w-2xl text-sm text-[--text-secondary] sm:text-base">
            Browse our industrial automation catalog by category. Find PLCs, drives, sensors, and more.
          </p>
        </div>
      </div>

      <div className="page-container relative z-10 py-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link key={cat.name} href={cat.slug ? `/categories/${cat.slug}` : `/search?category=${encodeURIComponent(cat.name)}`}>
              <div className="flex flex-col items-center gap-3 rounded-xl border border-[--border] bg-[--bg-surface] p-5 transition-all hover:border-[--accent] hover:bg-[--bg-elevated]">
                {cat.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.image_url} alt={cat.name} className="h-20 w-20 object-contain" />
                ) : (
                  <Package className="h-10 w-10 text-[--accent]" />
                )}
                <span className="text-center text-sm font-semibold text-[--text-primary]">{cat.name}</span>
                <span className="text-[--text-secondary] text-xs">{cat.product_count} parts</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
