import { Card } from '@/components/ui/Card'

export interface AdminStatsCardProps {
  label: string
  value: number | string
  trend?: string
}

export function AdminStatsCard({ label, value, trend }: AdminStatsCardProps) {
  return (
    <Card variant="bordered" padding="md">
      <p className="text-sm text-[var(--color-foreground-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">{value}</p>
      {trend ? <p className="mt-1 text-xs text-[var(--color-foreground-muted)]">{trend}</p> : null}
    </Card>
  )
}
