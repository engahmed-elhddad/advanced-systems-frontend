import Link from 'next/link'
import { getCategories } from '@/lib/api'
import { Cpu, Zap, Activity, Gauge, Wifi, Settings } from 'lucide-react'

const CATEGORY_ICONS: Record<string, any> = {
  PLC: Cpu, Drive: Zap, Sensor: Activity,
  HMI: Gauge, Communication: Wifi, default: Settings,
}

export const metadata = {
  title: 'Product Categories | Advanced Systems',
  description: 'Browse industrial automation parts by category: PLC, drives, sensors, HMI, and more.',
}

export default async function CategoriesPage() {
  let categories: { name: string; slug?: string; product_count?: number }[] = []
  try {
    const data = await getCategories()
    categories = Array.isArray(data) ? data : data?.categories || []
  } catch {}

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-gray-50 py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Product Categories
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Browse our industrial automation catalog by category. Find PLCs, drives, sensors, and more.
          </p>
        </div>
      </div>

      <div className="page-container py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(cat => {
            const iconKey = Object.keys(CATEGORY_ICONS).find(k => (cat.name || '').includes(k)) || 'default'
            const Icon = CATEGORY_ICONS[iconKey]
            const slug = cat.slug ?? (cat.name || '').toLowerCase().replace(/\s+/g, '-')
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
                  <div className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{cat.name}</div>
                  <div className="text-xs text-gray-500">{cat.product_count ?? 0} parts</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
