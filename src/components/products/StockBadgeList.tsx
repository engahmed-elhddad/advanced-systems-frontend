'use client'

import { Badge } from '@/components/ui/Badge'
import {
  STOCK_BADGE_LABELS_AR,
  STOCK_BADGE_LABELS_EN,
} from '@/lib/company'
import { useLocale } from '@/lib/locale'
import { cn } from '@/lib/utils'
import type { StockBadge } from '@/types/warehouse'

export interface StockBadgeListProps {
  badges: StockBadge[]
  compact?: boolean
  className?: string
}

type Labels = typeof STOCK_BADGE_LABELS_EN | typeof STOCK_BADGE_LABELS_AR

function badgeVariant(b: StockBadge): 'success' | 'info' | 'warning' {
  switch (b.kind) {
    case 'in_stock':
      return 'success'
    case 'lead_time':
      return 'info'
    case 'indent':
      return 'warning'
    default:
      return 'info'
  }
}

function renderBadgeText(b: StockBadge, labels: Labels, locale: 'en' | 'ar'): string {
  switch (b.kind) {
    case 'in_stock': {
      const name =
        locale === 'ar' ? (b.name_ar?.trim() ? b.name_ar : b.name_en) : b.name_en
      return `${labels.in_stock_prefix} ${name}`
    }
    case 'lead_time':
      return b.days === 7 ? labels.lead_time_7 : labels.lead_time_14
    case 'indent':
      return labels.indent
    default:
      return ''
  }
}

export function StockBadgeList({ badges, compact = false, className }: StockBadgeListProps) {
  const locale = useLocale()
  const labels = locale === 'ar' ? STOCK_BADGE_LABELS_AR : STOCK_BADGE_LABELS_EN
  const visible = compact ? badges.slice(0, 2) : badges
  const overflow = compact && badges.length > 2 ? badges.length - 2 : 0

  return (
    <div data-testid="stock-badge-list" className={cn('flex flex-wrap gap-1.5', className)}>
      {visible.map((b, i) => {
        const text = renderBadgeText(b, labels, locale)
        if (!text.trim()) return null
        return (
          <Badge key={i} variant={badgeVariant(b)} size="sm">
            {text}
          </Badge>
        )
      })}
      {overflow > 0 ? (
        <Badge variant="info" size="sm">
          +{overflow}
        </Badge>
      ) : null}
    </div>
  )
}
