import Link from 'next/link'
import { getCategoryIcon } from '@/lib/categoryIcons'

export interface CategoryCardProps {
  name: string
  slug?: string
  count?: number
  product_count?: number
}

export function CategoryCard({ name, slug, count, product_count }: CategoryCardProps) {
  const Icon = getCategoryIcon(name)
  const href = slug
    ? `/category/${slug}`
    : `/search?category=${encodeURIComponent(name)}`
  const displayCount = count ?? product_count ?? 0

  return (
    <Link
      href={href}
      className="card p-5 flex items-center gap-4 group"
    >
      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors shrink-0">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <div>
        <div className="font-semibold text-sm text-gray-900 group-hover:text-primary-600 transition-colors">
          {name}
        </div>
        <div className="text-xs text-gray-500">{displayCount} parts</div>
      </div>
    </Link>
  )
}
