'use client'

import { Toaster } from 'react-hot-toast'

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        className: '!bg-[#121a2e]/95 !text-white !text-sm !font-medium !shadow-xl !shadow-black/40 !border !border-white/10 !backdrop-blur-xl',
        success: { iconTheme: { primary: '#22c55e', secondary: '#0f172a' } },
        error: { iconTheme: { primary: '#f87171', secondary: '#0f172a' } },
      }}
    />
  )
}
