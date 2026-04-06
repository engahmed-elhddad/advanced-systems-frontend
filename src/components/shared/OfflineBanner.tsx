'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface OfflineBannerProps {
  onOnline?: () => void
}

export function OfflineBanner({ onOnline }: OfflineBannerProps) {
  const [offline, setOffline] = useState(false)
  const qc = useQueryClient()

  const handleOnline = useCallback(() => {
    setOffline(false)
    void qc.invalidateQueries()
    onOnline?.()
  }, [qc, onOnline])

  useEffect(() => {
    function onOffline() {
      setOffline(true)
    }
    setOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [handleOnline])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-[var(--color-warning)]/40 bg-[var(--color-warning)]/15 px-4 py-2 text-center text-sm text-[var(--color-foreground)]"
    >
      You are offline. Some actions may be unavailable until connection is restored.
    </div>
  )
}
