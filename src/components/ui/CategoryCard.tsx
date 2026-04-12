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
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--color-primary)_8%,transparent)] transition-colors group-hover:bg-[color:color-mix(in_srgb,var(--color-primary)_14%,transparent)]">
            <Icon className="h-8 w-8 text-[color:var(--color-primary)]" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold text-[var(--text-primary)] transition-colors group-hover:text-[color:var(--color-accent)]">
              {name}
            </div>
            <div className="mt-1.5 text-sm text-[var(--text-secondary)]">{displayCount} parts</div>
            <div className="mt-3 text-sm font-medium text-[color:var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100">
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
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--color-primary)_8%,transparent)] transition-colors group-hover:bg-[color:color-mix(in_srgb,var(--color-primary)_14%,transparent)]">
          <Icon className="h-7 w-7 text-[color:var(--color-primary)]" />
        </div>
        <div className="text-base font-bold text-[var(--text-primary)] transition-colors group-hover:text-[color:var(--color-accent)]">
          {name}
        </div>
        <div className="mt-2 text-xs text-[var(--text-secondary)]">{displayCount} parts</div>
        <div className="mt-auto pt-5 text-xs font-medium text-[color:var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100">
          Explore category →
        </div>
      </Card>
    </Link>
  )
}
