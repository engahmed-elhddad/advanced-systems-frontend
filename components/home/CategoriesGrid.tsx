import Link from 'next/link'
import { getCategories } from '@/lib/api'
import { CATEGORIES } from '@/app/lib/constants'
import { getCategoryIcon } from '@/lib/categoryIcons'

type Cat = { name: string; slug?: string; count?: number; product_count?: number }

export async function CategoriesGrid() {
  let apiCats: Cat[] = []
  try {
    const data = await getCategories()
    const arr = Array.isArray(data) ? data : data.categories || []
    apiCats = arr.slice(0, 12)
  } catch {}
  const categories: Cat[] =
    apiCats.length > 0 ? apiCats : CATEGORIES.map((c) => ({ name: c.name, slug: c.slug }))

  if (!categories.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Featured Categories</h2>
        <Link href="/categories" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          View all categories →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.name)
          const href = cat.slug ? `/category/${cat.slug}` : `/search?category=${encodeURIComponent(cat.name)}`
          const count = cat.count ?? cat.product_count ?? 0
          return (
            <Link
              key={cat.name}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-slate-600 group-hover:text-primary-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-slate-900 text-sm truncate">{cat.name}</div>
                {count > 0 && (
                  <div className="text-xs text-slate-500">{count} parts</div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
