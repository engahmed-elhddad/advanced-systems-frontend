'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useShopAuth } from '@/components/providers/ShopAuthProvider'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const { user, loading, refreshSession } = useShopAuth()

  useEffect(() => {
    if (!loading) void refreshSession()
  }, [loading, refreshSession])

  if (loading) {
    return <main className="mx-auto max-w-lg px-4 py-16 text-center text-[--text-secondary]">Loading…</main>
  }

  if (user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[--text-primary]">You are signed in</h1>
        <p className="mt-3 text-[--text-secondary]">Continue to your account area.</p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/account/company">Go to My Company</Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-[--text-primary]">Customer Login</h1>
      <p className="mt-3 text-[--text-secondary]">
        Customer pricing is available without Google sign-in. If your account session is missing, continue to your company page and sign in there using your existing account flow.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href="/account/company">Go to My Company</Link>
        </Button>
      </div>
      <p className="mt-6 text-sm text-[--text-secondary]">
        Admin access? <Link href="/admin/login" className="text-[--accent] hover:text-[--accent-hover]">Go to admin login</Link>
      </p>
    </main>
  )
}
