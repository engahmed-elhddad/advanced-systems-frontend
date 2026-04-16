import Link from 'next/link'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { normalizeCategoryQueryForApi } from '@/lib/constants'
import { Card } from '@/components/ui/Card'

export interface CategoryCardProps {
  name: string
  slug?: string
  count?: number
  product_count?: number
  variant?: 'large' | 'default'
}

export function CategoryCard({ name, slug, count, product_count, variant = 'default' }: CategoryCardProps) {
  const Icon = getCategoryIcon(name)
  const href = slug
    ? `/categories/${slug}`
    : `/search?category=${encodeURIComponent(normalizeCategoryQueryForApi(name))}`
  const displayCount = count ?? product_count ?? 0

  if (variant === 'large') {
    return (
      <Link
        href={href}
        className="group"
      >
        <Card className="flex min-h-[150px] items-center gap-5 p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 transition-colors group-hover:bg-orange-500/25">
            <Icon className="h-8 w-8 text-orange-300" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold text-white transition-colors group-hover:text-orange-200">
              {name}
            </div>
            <div className="mt-1.5 text-sm text-white/55">{displayCount} parts</div>
            <div className="mt-3 text-sm font-medium text-orange-300/90 opacity-0 transition-opacity group-hover:opacity-100">
              Explore category →
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="group"
    >
      <Card className="flex min-h-[180px] flex-col items-start p-7">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/15 transition-colors group-hover:bg-orange-500/25">
          <Icon className="h-7 w-7 text-orange-300" />
        </div>
        <div className="text-base font-bold text-white transition-colors group-hover:text-orange-200">
          {name}
        </div>
        <div className="mt-2 text-xs text-white/55">{displayCount} parts</div>
        <div className="mt-auto pt-5 text-xs font-medium text-orange-300/90 opacity-0 transition-opacity group-hover:opacity-100">
          Explore category →
        </div>
      </Card>
    </Link>
  )
}
