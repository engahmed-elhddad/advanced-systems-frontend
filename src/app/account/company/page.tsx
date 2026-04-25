'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useShopAuth } from '@/components/providers/ShopAuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { API_BASE_URL } from '@/lib/constants'

const base = API_BASE_URL.replace(/\/$/, '')

type CompanyPayload = {
  id: number
  name: string
  tax_id: string | null
  country: string | null
  city: string | null
  phone: string | null
  website: string | null
  is_verified: boolean
  created_at: string
}

type MemberPayload = {
  id: number
  email: string
  full_name: string | null
  company_role: string | null
}

type CompanyWithMembers = {
  company: CompanyPayload
  members: MemberPayload[]
}

const heroShell =
  'rounded-2xl border border-[--border-dark] bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8'
const cardShell =
  'rounded-2xl border border-[--border-dark] bg-white/[0.04] p-5 backdrop-blur-xl sm:p-6'

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown }
    const d = j?.detail
    if (typeof d === 'string') return d
    if (d != null) return JSON.stringify(d)
  } catch {
    /* ignore */
  }
  return res.statusText || `Error ${res.status}`
}

export default function CompanyAccountPage() {
  const { user, loading: authLoading, openLoginModal, refreshSession } = useShopAuth()
  const [companyState, setCompanyState] = useState<'loading' | 'none' | 'ready' | 'error'>('loading')
  const [companyData, setCompanyData] = useState<CompanyWithMembers | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [createName, setCreateName] = useState('')
  const [createTaxId, setCreateTaxId] = useState('')
  const [createCity, setCreateCity] = useState('')
  const [createCountry, setCreateCountry] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteOk, setInviteOk] = useState<string | null>(null)

  const loadCompany = useCallback(async () => {
    if (!user) {
      setCompanyState('loading')
      return
    }
    setCompanyState('loading')
    setLoadError(null)
    const res = await fetch(`${base}/api/v1/companies/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (res.status === 404) {
      setCompanyData(null)
      setCompanyState('none')
      return
    }
    if (!res.ok) {
      setCompanyState('error')
      setLoadError(await readErrorDetail(res))
      return
    }
    const data = (await res.json()) as CompanyWithMembers
    setCompanyData(data)
    setCompanyState('ready')
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setCompanyState('loading')
      setCompanyData(null)
      setLoadError(null)
      return
    }
    void loadCompany()
  }, [user, authLoading, loadCompany])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = createName.trim()
    if (!name) return
    setCreateSubmitting(true)
    setCreateError(null)
    const res = await fetch(`${base}/api/v1/companies/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name,
        tax_id: createTaxId.trim() || null,
        city: createCity.trim() || null,
        country: createCountry.trim() || null,
        phone: createPhone.trim() || null,
      }),
    })
    setCreateSubmitting(false)
    if (!res.ok) {
      setCreateError(await readErrorDetail(res))
      return
    }
    await refreshSession()
    void loadCompany()
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = inviteEmail.trim().toLowerCase()
    if (!email.includes('@')) return
    setInviteSubmitting(true)
    setInviteError(null)
    setInviteOk(null)
    const res = await fetch(`${base}/api/v1/companies/invite`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email }),
    })
    setInviteSubmitting(false)
    if (!res.ok) {
      setInviteError(await readErrorDetail(res))
      return
    }
    setInviteEmail('')
    setInviteOk('Member added.')
    void loadCompany()
  }

  const meIsOwner =
    user &&
    companyData?.members.some(
      (m) => m.email.toLowerCase() === user.email.toLowerCase() && m.company_role === 'owner',
    )

  if (authLoading) {
    return (
      <div className="relative min-h-screen pb-24 pt-8 sm:pt-12">
        <div className="page-container">
          <Skeleton variant="rect" height={160} className="w-full rounded-2xl bg-white/10" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative min-h-screen pb-24 pt-8 sm:pt-12">
        <div className="page-container relative z-10">
          <nav className="mb-6 text-xs text-[--text-secondary]">
            <Link href="/" className="transition-colors hover:text-[--text-primary]">
              Home
            </Link>
            <span className="mx-1.5 text-[--text-secondary]/50">/</span>
            <span className="text-[--text-primary]">My Company</span>
          </nav>
          <div className={heroShell}>
            <h1 className="text-2xl font-semibold tracking-tight text-[--text-primary] sm:text-3xl">Company account</h1>
            <p className="mt-2 max-w-xl text-sm text-[--text-secondary]">
              Sign in with Google to create or manage your company and invite team members.
            </p>
            <Button type="button" className="mt-6" onClick={() => openLoginModal()}>
              Sign in
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pb-24 pt-8 sm:pt-12">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(100%,520px)] -translate-x-1/2 rounded-full bg-orange-500/12 blur-[100px]" aria-hidden />
      <div className="page-container relative z-10">
        <nav className="mb-6 text-xs text-[--text-secondary]">
          <Link href="/" className="transition-colors hover:text-[--text-primary]">
            Home
          </Link>
          <span className="mx-1.5 text-[--text-secondary]/50">/</span>
          <span className="text-[--text-primary]">My Company</span>
        </nav>

        <header className={heroShell}>
          <h1 className="text-2xl font-semibold tracking-tight text-[--text-primary] sm:text-3xl">My company</h1>
          <p className="mt-2 max-w-2xl text-sm text-[--text-secondary]">
            Signed in as <span className="text-[--text-primary]">{user.email}</span>
          </p>
        </header>

        {companyState === 'loading' && (
          <div className="mt-8 space-y-4">
            <Skeleton variant="rect" height={120} className="w-full rounded-2xl bg-white/10" />
            <Skeleton variant="rect" height={200} className="w-full rounded-2xl bg-white/10" />
          </div>
        )}

        {companyState === 'error' && (
          <div
            className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200"
            role="alert"
          >
            {loadError ?? 'Could not load company.'}
          </div>
        )}

        {companyState === 'none' && (
          <form onSubmit={handleCreate} className={`mt-8 space-y-4 ${cardShell}`}>
            <h2 className="text-lg font-semibold text-[--text-primary]">Create company</h2>
            <p className="text-sm text-[--text-secondary]">
              You are not linked to a company yet. Submit the details below; you will become the owner.
            </p>
            <Input
              label="Company name"
              name="name"
              required
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Acme Industrial"
            />
            <Input
              label="Tax ID"
              name="tax_id"
              value={createTaxId}
              onChange={(e) => setCreateTaxId(e.target.value)}
              placeholder="Optional"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="City" name="city" value={createCity} onChange={(e) => setCreateCity(e.target.value)} />
              <Input
                label="Country"
                name="country"
                value={createCountry}
                onChange={(e) => setCreateCountry(e.target.value)}
              />
            </div>
            <Input label="Phone" name="phone" type="tel" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} />
            {createError && (
              <p className="text-sm text-red-300" role="alert">
                {createError}
              </p>
            )}
            <Button type="submit" disabled={createSubmitting}>
              {createSubmitting ? 'Creating…' : 'Create company'}
            </Button>
          </form>
        )}

        {companyState === 'ready' && companyData && (
          <div className="mt-8 space-y-8">
            <section className={cardShell}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-[--text-primary]">Company info</h2>
                {companyData.company.is_verified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="pending">Not verified</Badge>
                )}
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {(
                  [
                    ['Name', companyData.company.name],
                    ['Tax ID', companyData.company.tax_id ?? '—'],
                    ['City', companyData.company.city ?? '—'],
                    ['Country', companyData.company.country ?? '—'],
                    ['Phone', companyData.company.phone ?? '—'],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[--text-secondary]">{k}</dt>
                    <dd className="mt-0.5 font-medium text-[--text-primary]">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className={cardShell}>
              <h2 className="text-lg font-semibold text-[--text-primary]">Members</h2>
              <div className="mt-4 overflow-x-auto rounded-xl border border-[--border-dark]">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="border-b border-[--border-dark] bg-white/[0.04] text-[--text-secondary]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--border-dark] text-[--text-primary]">
                    {companyData.members.map((m) => {
                      const role = (m.company_role ?? 'member').toLowerCase()
                      const label = role === 'owner' ? 'Owner' : 'Member'
                      const variant = role === 'owner' ? 'success' : 'default'
                      return (
                        <tr key={m.id}>
                          <td className="px-4 py-3">{m.full_name?.trim() || '—'}</td>
                          <td className="px-4 py-3 text-[--text-secondary]">{m.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant={variant}>{label}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={cardShell}>
              <h2 className="text-lg font-semibold text-[--text-primary]">Invite member</h2>
              <p className="mt-1 text-sm text-[--text-secondary]">
                The person must already have a shop account (same email they used to sign in).
              </p>
              {meIsOwner ? (
                <>
                  <form onSubmit={handleInvite} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1 sm:max-w-md">
                      <Input
                        label="Email"
                        type="email"
                        name="invite_email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={inviteSubmitting}>
                      {inviteSubmitting ? 'Sending…' : 'Invite'}
                    </Button>
                  </form>
                  {inviteError && (
                    <p className="mt-3 text-sm text-red-300" role="alert">
                      {inviteError}
                    </p>
                  )}
                  {inviteOk && !inviteError && (
                    <p className="mt-3 text-sm text-emerald-300/90" role="status">
                      {inviteOk}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-4 text-sm text-[--text-secondary]">Only the company owner can invite members.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
