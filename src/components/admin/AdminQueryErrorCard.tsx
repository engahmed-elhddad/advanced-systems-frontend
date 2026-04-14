'use client'

import { Button } from '@/components/ui/Button'

export function AdminQueryErrorCard({
  title = 'Could not load data',
  message,
  onRetry,
  retrying,
}: {
  title?: string
  message: string
  onRetry: () => void
  retrying?: boolean
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-400/35 bg-red-500/10 px-5 py-6 text-center backdrop-blur-xl"
    >
      <p className="text-sm font-semibold text-red-100">{title}</p>
      <p className="mt-2 text-sm text-red-100/80">{message}</p>
      <Button type="button" className="mt-4" variant="secondary" surface="dark" loading={retrying} onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}
