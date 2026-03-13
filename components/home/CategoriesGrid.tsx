import Link from 'next/link'
import { getCategories } from '@/lib/api'
import { Cpu, Zap, Activity, Gauge, Wifi, Settings } from 'lucide-react'

const CATEGORY_ICONS: Record<string, any> = {
  PLC: Cpu, Drive: Zap, Sensor: Activity,
  HMI: Gauge, Communication: Wifi, default: Settings,
}

export async function CategoriesGrid() {
  let categories: { name: string; count?: number; product_count?: number }[] = []
  try {
    const data = await getCategories()
    const arr = Array.isArray(data) ? data : data.categories || []
    categories = arr.slice(0, 8)
  } catch {}

  if (!categories.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Browse by Category</h2>
        <Link href="/categories" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
          All categories →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(cat => {
          const iconKey = Object.keys(CATEGORY_ICONS).find(k => (cat.name || '').includes(k)) || 'default'
          const Icon = CATEGORY_ICONS[iconKey]
          return (
            <Link
              key={cat.name}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              className="card p-5 flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors shrink-0">
                <Icon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900 group-hover:text-primary-600 transition-colors">{cat.name}</div>
                <div className="text-xs text-gray-500">{cat.count ?? cat.product_count ?? 0} parts</div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
