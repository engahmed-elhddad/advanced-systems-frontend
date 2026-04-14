'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin route error]', error)
  }, [error])

  return (
    <div className="flex min-h-[min(70vh,720px)] flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-semibold text-white">This admin view hit an error</h1>
        <p className="text-sm leading-relaxed text-white/65">
          {error.message || 'An unexpected problem occurred. You can retry or go back to the dashboard.'}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" variant="primary" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="secondary" surface="dark" asChild>
          <a href="/admin">Dashboard</a>
        </Button>
      </div>
    </div>
  )
}
