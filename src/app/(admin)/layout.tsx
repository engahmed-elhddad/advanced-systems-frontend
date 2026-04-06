'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') {
      setReady(true)
      return
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    if (!token) {
      router.replace('/admin/login')
      return
    }
    setReady(true)
  }, [pathname, router])

  if (!ready) {
    return <div className="p-6 text-sm text-[var(--color-foreground-muted)]">Loading...</div>
  }

  return <>{children}</>
}
