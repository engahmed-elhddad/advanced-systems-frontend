'use client'

import { Badge } from '@/components/ui/Badge'

const variantMap: Record<string, 'pending' | 'success' | 'warning' | 'info' | 'default'> = {
  pending: 'pending',
  in_progress: 'info',
  quoted: 'success',
  responded: 'success',
  closed: 'default',
  cancelled: 'warning',
}

export function RFQStatusBadge({ status }: { status: string }) {
  const v = variantMap[status] ?? 'default'
  return (
    <Badge variant={v} size="sm" dot>
      {status}
    </Badge>
  )
}
