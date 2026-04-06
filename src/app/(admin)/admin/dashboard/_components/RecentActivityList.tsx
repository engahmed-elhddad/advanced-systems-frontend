import Link from 'next/link'
import { cn } from '@/lib/utils'
import type {
  B2BQuotationSummary,
  B2BOrderSummary,
  B2BInvoiceSummary,
} from '@/services/adminService'

// ── Status badge ───────────────────────────────────────────────────────────────

type StatusBadgeProps = { status: string }

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]',
  sent:      'bg-sky-50   text-sky-700   border-sky-200',
  approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:  'bg-red-50   text-red-700   border-red-200',
  converted: 'bg-purple-50 text-purple-700 border-purple-200',
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  delivered: 'bg-[#E8F4FD] text-[#0072CE] border-[#0072CE]/20',
  cancelled: 'bg-slate-50 text-slate-500 border-slate-200',
  issued:    'bg-[#E8F4FD] text-[#0072CE] border-[#0072CE]/20',
  paid:      'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function StatusBadge({ status }: StatusBadgeProps) {
  const cls = STATUS_STYLES[status.toLowerCase()] ?? 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]'
  return (
    <span
      className={cn(
        'inline-block rounded-[2px] border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        cls,
      )}
    >
      {status}
    </span>
  )
}

// ── Date formatter ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Section shell ──────────────────────────────────────────────────────────────

function Section({
  title,
  viewAllHref,
  loading,
  empty,
  children,
}: {
  title: string
  viewAllHref?: string
  loading: boolean
  empty: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-[11px] font-medium text-[#0072CE] hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-[2px] bg-[#F3F4F6]" />
          ))}
        </div>
      ) : empty ? (
        <p className="px-4 py-6 text-center text-sm text-[#6B7280]">No recent activity</p>
      ) : (
        children
      )}
    </div>
  )
}

// ── Row template ───────────────────────────────────────────────────────────────

function ActivityRow({
  id,
  label,
  customer,
  status,
  amount,
  date,
  href,
}: {
  id: string | number
  label: string
  customer: string
  status: string
  amount: number
  date: string
  href?: string
}) {
  const inner = (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-[#F3F4F6] px-4 py-2.5 last:border-0',
        href && 'hover:bg-[#F9FAFB] transition-colors duration-100',
      )}
    >
      <span className="w-16 flex-shrink-0 font-mono text-[11px] font-semibold text-[#0072CE]">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-[#1A1A1A]">{customer}</span>
      <StatusBadge status={status} />
      <span className="flex-shrink-0 text-[11px] tabular-nums text-[#6B7280]">
        {formatCurrency(amount)}
      </span>
      <span className="flex-shrink-0 text-[11px] text-[#9CA3AF]">{formatDate(date)}</span>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    )
  }
  return inner
}

// ── Public sub-components ──────────────────────────────────────────────────────

interface QuotationsProps {
  items: B2BQuotationSummary[]
  loading: boolean
}

export function RecentQuotations({ items, loading }: QuotationsProps) {
  return (
    <Section
      title="Recent Quotations"
      viewAllHref="/admin/b2b/quotations"
      loading={loading}
      empty={items.length === 0}
    >
      {items.map((q) => (
        <ActivityRow
          key={q.id}
          id={q.id}
          label={`Q-${String(q.id).padStart(4, '0')}`}
          customer={q.customer_name}
          status={q.status}
          amount={q.total_amount}
          date={q.created_at}
        />
      ))}
    </Section>
  )
}

interface OrdersProps {
  items: B2BOrderSummary[]
  loading: boolean
}

export function RecentOrders({ items, loading }: OrdersProps) {
  return (
    <Section
      title="Recent Orders"
      viewAllHref="/admin/b2b/orders"
      loading={loading}
      empty={items.length === 0}
    >
      {items.map((o) => (
        <ActivityRow
          key={o.id}
          id={o.id}
          label={`ORD-${String(o.id).padStart(4, '0')}`}
          customer={o.customer_name}
          status={o.status}
          amount={o.total_amount}
          date={o.created_at}
        />
      ))}
    </Section>
  )
}

interface InvoicesProps {
  items: B2BInvoiceSummary[]
  loading: boolean
}

export function RecentInvoices({ items, loading }: InvoicesProps) {
  return (
    <Section
      title="Recent Invoices"
      viewAllHref="/admin/b2b/invoices"
      loading={loading}
      empty={items.length === 0}
    >
      {items.map((inv) => (
        <ActivityRow
          key={inv.id}
          id={inv.id}
          label={inv.invoice_number ?? `INV-${String(inv.id).padStart(4, '0')}`}
          customer={inv.customer_name}
          status={inv.status}
          amount={inv.total_amount}
          date={inv.created_at}
        />
      ))}
    </Section>
  )
}
