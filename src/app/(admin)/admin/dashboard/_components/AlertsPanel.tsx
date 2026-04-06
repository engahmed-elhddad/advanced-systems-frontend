import { AlertTriangle, Clock, FileWarning, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { B2BDashboardResponse } from '@/services/adminService'

type Alerts = B2BDashboardResponse['alerts']

// ── Individual alert row ───────────────────────────────────────────────────────

function AlertRow({
  level,
  icon: Icon,
  title,
  detail,
}: {
  level: 'danger' | 'warning'
  icon: typeof AlertTriangle
  title: string
  detail: string
}) {
  const styles =
    level === 'danger'
      ? {
          bar: 'bg-red-500',
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-500',
          title: 'text-red-800',
          detail: 'text-red-600',
        }
      : {
          bar: 'bg-amber-400',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: 'text-amber-500',
          title: 'text-amber-800',
          detail: 'text-amber-600',
        }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[2px] border p-3',
        styles.bg,
        styles.border,
      )}
      role="alert"
    >
      <div
        className={cn('mt-0.5 flex-shrink-0', styles.icon)}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className={cn('text-sm font-semibold', styles.title)}>{title}</p>
        <p className={cn('mt-0.5 text-[11px]', styles.detail)}>{detail}</p>
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function NoAlerts() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
        <AlertTriangle className="h-5 w-5 text-emerald-500" aria-hidden />
      </div>
      <p className="text-sm font-medium text-[#1A1A1A]">All clear</p>
      <p className="text-[11px] text-[#6B7280]">No active alerts at this time</p>
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────────

interface AlertsPanelProps {
  alerts: Alerts | undefined
  loading: boolean
}

export function AlertsPanel({ alerts, loading }: AlertsPanelProps) {
  const staleOrders = alerts?.stale_orders ?? []
  const unpaidInvoices = alerts?.unpaid_invoice_list ?? []
  const lowStockItems = alerts?.low_stock_items ?? []

  const rows: Array<{
    level: 'danger' | 'warning'
    icon: typeof AlertTriangle
    title: string
    detail: string
    key: string
  }> = []

  staleOrders.forEach((o) => {
    rows.push({
      key: `stale-order-${o.id}`,
      level: 'danger',
      icon: Clock,
      title: `Order ORD-${String(o.id).padStart(4, '0')} pending > 48h`,
      detail: `Customer: ${o.customer_name} — $${o.total_amount.toFixed(2)} — awaiting confirmation`,
    })
  })

  unpaidInvoices.forEach((inv) => {
    rows.push({
      key: `unpaid-invoice-${inv.id}`,
      level: 'warning',
      icon: FileWarning,
      title: `Invoice ${inv.invoice_number ?? `#${inv.id}`} unpaid`,
      detail: `Customer: ${inv.customer_name} — $${inv.total_amount.toFixed(2)} — status: ${inv.status}`,
    })
  })

  lowStockItems.forEach((item) => {
    rows.push({
      key: `low-stock-${item.product_id}`,
      level: 'warning',
      icon: Package,
      title: `Low stock: ${item.part_number}`,
      detail: `Only ${item.available} unit${item.available === 1 ? '' : 's'} available`,
    })
  })

  const hasAlerts = rows.length > 0

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">
          Alerts
          {hasAlerts && !loading && (
            <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {rows.length > 9 ? '9+' : rows.length}
            </span>
          )}
        </h3>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-[2px] bg-[#F3F4F6]" />
            ))}
          </div>
        ) : !hasAlerts ? (
          <NoAlerts />
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <AlertRow
                key={r.key}
                level={r.level}
                icon={r.icon}
                title={r.title}
                detail={r.detail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
