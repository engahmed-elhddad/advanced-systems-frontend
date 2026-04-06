'use client'

import { ErrorBanner } from '@/components/shared/ErrorBanner'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <ErrorBanner message={error.message || 'Something went wrong'} onRetry={reset} />
    </main>
  )
}
