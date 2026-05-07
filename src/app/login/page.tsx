'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useShopAuth } from '@/components/providers/ShopAuthProvider'
import { Button } from '@/components/ui/Button'
import { API_BASE_URL } from '@/lib/constants'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, refreshSession } = useShopAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { detail?: string }
        throw new Error(payload.detail || 'Invalid email or password.')
      }

      await refreshSession()
      router.push('/account/company')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-[--text-primary]">Customer Login</h1>
      <p className="mt-3 text-[--text-secondary]">Sign in to access your customer account.</p>

      <form className="mx-auto mt-8 space-y-4 text-start" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[--text-secondary]">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-[--border-dark] bg-[--bg-secondary] px-3 py-2 text-[--text-primary] outline-none transition-colors focus:border-[--accent]"
            placeholder="you@company.com"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[--text-secondary]">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-[--border-dark] bg-[--bg-secondary] px-3 py-2 text-[--text-primary] outline-none transition-colors focus:border-[--accent]"
            placeholder="Enter your password"
          />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-sm text-[--text-secondary]">
        <p>
          Need customer access? <Link href="/account/company" className="text-[--accent] hover:text-[--accent-hover]">Go to My Company</Link>
        </p>
        <p>
          Admin access? <Link href="/admin/login" className="text-[--accent] hover:text-[--accent-hover]">Go to admin login</Link>
        </p>
      </div>
    </main>
  )
}
