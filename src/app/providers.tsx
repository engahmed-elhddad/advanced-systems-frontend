'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect } from 'react'
import { queryClient } from '@/lib/queryClient'
import { useUIStore } from '@/state/useUIStore'
import { useAuthStore } from '@/state/useAuthStore'
import { ToastViewport } from '@/components/ui/Toast'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

function ThemeHydration() {
  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    const theme = useUIStore.getState().theme
    document.documentElement.classList.toggle('light', theme === 'light')

    function handleOffline() {
      toast.error('You are offline. Some data may be unavailable.')
    }
    function handleOnline() {
      toast.success('Back online.')
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeHydration />
      {children}
      <ToastViewport />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            background: '#0B1F3A',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      />
      {process.env.NODE_ENV === 'development' ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      ) : null}
    </QueryClientProvider>
  )
}
