import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon: LucideIcon
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
  variant?: 'default' | 'warning' | 'danger' | 'success'
  loading?: boolean
}

const variantStyles: Record<NonNullable<KpiCardProps['variant']>, string> = {
  default: 'border-[#E5E7EB]',
  warning: 'border-amber-200 bg-amber-50/50',
  danger: 'border-red-200 bg-red-50/50',
  success: 'border-emerald-200 bg-emerald-50/50',
}

const iconStyles: Record<NonNullable<KpiCardProps['variant']>, string> = {
  default: 'text-[#0072CE] bg-[#E8F4FD]',
  warning: 'text-amber-600 bg-amber-100',
  danger: 'text-red-600 bg-red-100',
  success: 'text-emerald-600 bg-emerald-100',
}

const trendColors = {
  up: 'text-emerald-600',
  down: 'text-red-500',
  neutral: 'text-[#6B7280]',
}

const trendArrows = {
  up: '↑',
  down: '↓',
  neutral: '→',
}

export function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  trend,
  variant = 'default',
  loading = false,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-[4px] border bg-white p-4 shadow-sm',
        variantStyles[variant],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            {label}
          </p>

          {loading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded-[2px] bg-[#E5E7EB]" />
          ) : (
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#1A1A1A]">
              {value}
            </p>
          )}

          {sublabel && !loading && (
            <p className="mt-0.5 text-[11px] text-[#6B7280]">{sublabel}</p>
          )}

          {trend && !loading && (
            <p className={cn('mt-1.5 text-[11px] font-medium', trendColors[trend.direction])}>
              <span aria-hidden>{trendArrows[trend.direction]} </span>
              {trend.label}
            </p>
          )}
        </div>

        <div
          className={cn(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[4px]',
            iconStyles[variant],
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>
    </div>
  )
}
