'use client'

import { useCallback, useEffect, useMemo, useState, memo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

import { DataTable, type DataTableColumnMeta, Badge, Button, Input } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api'
import {
  type AdminBrandRow,
  type AdminBrandAliasRow,
  fetchAdminBrands,
  fetchAdminBrandAliases,
  createAdminBrand,
  updateAdminBrand,
  deleteAdminBrand,
  addAdminBrandAlias,
  removeAdminBrandAlias,
} from '@/lib/admin-api'
import { formatBrandNameInput } from '@/lib/brandCategoryFormat'
import { adminLightTextareaClass } from '@/lib/adminFormClasses'

const QKEY = ['admin-brands'] as const

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function brandInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2)
  }
  const t = name.trim()
  return (t.slice(0, 2) || '—').toUpperCase()
}

function normalizeWebsiteHref(url: string): string | null {
  const t = url.trim()
  if (!t) return null
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

const aliasChipClass =
  'inline-flex max-w-[140px] items-center truncate rounded-full border border-orange-400/40 bg-orange-500/15 px-2.5 py-0.5 text-xs font-medium text-orange-200'

const BrandRowLogo = memo(function BrandRowLogo({ name, src }: { name: string; src: string }) {
  const [failed, setFailed] = useState(false)
  const url = src.trim()
  useEffect(() => {
    setFailed(false)
  }, [url])
  if (!url || failed) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-orange-500/20 to-white/5 text-xs font-bold text-orange-200">
        {brandInitials(name)}
      </div>
    )
  }
  return (
    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.06]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="h-full w-full object-contain p-1"
        onError={() => setFailed(true)}
      />
    </div>
  )
})

type DrawerMode = 'add' | 'edit'

export default function AdminBrandsPage() {
  const qc = useQueryClient()
  const listQ = useQuery({
    queryKey: QKEY,
    queryFn: async () => {
      const res = await fetchAdminBrands()
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
  })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [website, setWebsite] = useState('')
  const [country, setCountry] = useState('')
  const [description, setDescription] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [parentBrandId, setParentBrandId] = useState('')
  const [newAlias, setNewAlias] = useState('')

  const closeDrawer = useCallback(() => {
    const aliasBrandId = editingId
    setDrawerOpen(false)
    setEditingId(null)
    setSlugTouched(false)
    setNewAlias('')
    if (aliasBrandId != null) {
      void qc.removeQueries({ queryKey: ['admin-brand-aliases', aliasBrandId] })
    }
  }, [qc, editingId])

  const openAdd = useCallback(() => {
    setDrawerMode('add')
    setEditingId(null)
    setName('')
    setSlug('')
    setSlugTouched(false)
    setLogoUrl('')
    setWebsite('')
    setCountry('')
    setDescription('')
    setIsVerified(false)
    setParentBrandId('')
    setNewAlias('')
    setDrawerOpen(true)
  }, [])

  const openEdit = useCallback((row: AdminBrandRow) => {
    setDrawerMode('edit')
    setEditingId(row.id)
    setName(row.name)
    setSlug(row.slug ?? '')
    setSlugTouched(true)
    setLogoUrl(row.logo_url ?? '')
    setWebsite(row.website ?? '')
    setCountry(row.country ?? '')
    setDescription(row.description ?? '')
    setIsVerified(Boolean(row.is_verified))
    setParentBrandId(row.parent_brand_id != null ? String(row.parent_brand_id) : '')
    setNewAlias('')
    setDrawerOpen(true)
  }, [])

  useEffect(() => {
    if (drawerMode !== 'add' || slugTouched) return
    setSlug(slugFromName(name))
  }, [name, drawerMode, slugTouched])

  const aliasRowsQ = useQuery({
    queryKey: ['admin-brand-aliases', editingId] as const,
    queryFn: async () => {
      if (editingId == null) return [] as AdminBrandAliasRow[]
      const res = await fetchAdminBrandAliases(editingId)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    enabled: Boolean(drawerOpen && drawerMode === 'edit' && editingId != null),
  })

  const createMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required')
      const body: Record<string, unknown> = { name: name.trim(), is_verified: isVerified }
      const s = slug.trim()
      if (s) body.slug = s
      if (logoUrl.trim()) body.logo_url = logoUrl.trim()
      if (website.trim()) body.website = website.trim()
      if (country.trim()) body.country = country.trim()
      if (description.trim()) body.description = description.trim()
      if (parentBrandId.trim()) body.parent_brand_id = Number(parentBrandId)
      else body.parent_brand_id = null
      const res = await createAdminBrand(body)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    onSuccess: () => {
      toast.success('Brand created')
      void qc.invalidateQueries({ queryKey: QKEY })
      closeDrawer()
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e, 'Create failed')),
  })

  const updateMut = useMutation({
    mutationFn: async () => {
      if (editingId == null) throw new Error('Nothing to update')
      if (!name.trim()) throw new Error('Name is required')
      const body: Record<string, unknown> = {
        name: name.trim(),
        logo_url: logoUrl.trim() || null,
        website: website.trim() || null,
        country: country.trim() || null,
        description: description.trim() || null,
        is_verified: isVerified,
        parent_brand_id: parentBrandId.trim() ? Number(parentBrandId) : null,
      }
      const slugTrim = slug.trim()
      if (slugTrim) body.slug = slugTrim
      const res = await updateAdminBrand(editingId, body)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    onSuccess: () => {
      toast.success('Brand saved')
      void qc.invalidateQueries({ queryKey: QKEY })
      void qc.invalidateQueries({ queryKey: ['admin-brand-aliases', editingId] })
      closeDrawer()
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e, 'Update failed')),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await deleteAdminBrand(id)
      if (!res.ok) throw new Error(res.message)
    },
    onSuccess: () => {
      toast.success('Brand deleted')
      void qc.invalidateQueries({ queryKey: QKEY })
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e, 'Delete failed')),
  })

  const addAliasMut = useMutation({
    mutationFn: async () => {
      if (editingId == null) throw new Error('No brand')
      const a = newAlias.trim()
      if (!a) throw new Error('Enter an alias')
      const res = await addAdminBrandAlias(editingId, a)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    onSuccess: () => {
      toast.success('Alias added')
      setNewAlias('')
      void qc.invalidateQueries({ queryKey: ['admin-brand-aliases', editingId] })
      void qc.invalidateQueries({ queryKey: QKEY })
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e, 'Could not add alias')),
  })

  const removeAliasMut = useMutation({
    mutationFn: async ({ aliasId }: { aliasId: number }) => {
      if (editingId == null) throw new Error('No brand')
      const res = await removeAdminBrandAlias(editingId, aliasId)
      if (!res.ok) throw new Error(res.message)
    },
    onSuccess: () => {
      toast.success('Alias removed')
      void qc.invalidateQueries({ queryKey: ['admin-brand-aliases', editingId] })
      void qc.invalidateQueries({ queryKey: QKEY })
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e, 'Could not remove alias')),
  })

  const savePending = createMut.isPending || updateMut.isPending

  const handleSave = useCallback(async () => {
    if (savePending) return
    try {
      if (drawerMode === 'edit') await updateMut.mutateAsync()
      else await createMut.mutateAsync()
    } catch {
      /* toast in mutation */
    }
  }, [drawerMode, savePending, createMut, updateMut])

  const rows = listQ.data ?? []

  const parentOptions = useMemo(() => {
    return rows
      .filter((b) => (editingId == null ? true : b.id !== editingId))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [rows, editingId])

  const columns: ColumnDef<AdminBrandRow & Record<string, unknown>, unknown>[] = useMemo(
    () => [
      {
        id: 'logo',
        header: 'Logo',
        cell: ({ row }) => {
          const r = row.original
          return <BrandRowLogo name={r.name} src={r.logo_url ?? ''} />
        },
      },
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-white">{row.original.name}</span>
            {row.original.is_verified ? (
              <Badge variant="success" size="sm">
                Verified
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: 'slug',
        header: 'Slug',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-white/65">{row.original.slug ?? '—'}</span>
        ),
      },
      {
        id: 'aliases',
        header: 'Aliases',
        meta: { className: 'max-w-[260px]' } as DataTableColumnMeta,
        cell: ({ row }) => {
          const all = row.original.aliases ?? []
          const show = all.slice(0, 3)
          const more = all.length - show.length
          return (
            <div className="flex flex-wrap items-center gap-1">
              {show.map((a, i) => (
                <span key={`${a}-${i}`} className={aliasChipClass} title={a}>
                  {a}
                </span>
              ))}
              {more > 0 ? (
                <Badge variant="default" size="sm" className="border-orange-400/30 bg-orange-500/10 text-orange-200">
                  +{more}
                </Badge>
              ) : null}
              {all.length === 0 ? <span className="text-xs text-white/40">—</span> : null}
            </div>
          )
        },
      },
      {
        id: 'product_count',
        header: 'Products',
        cell: ({ row }) => (
          <Badge variant="default" size="sm">
            {row.original.product_count ?? 0}
          </Badge>
        ),
      },
      {
        id: 'website',
        header: 'Website',
        meta: { className: 'max-w-[200px]' } as DataTableColumnMeta,
        cell: ({ row }) => {
          const w = (row.original.website ?? '').trim()
          if (!w) return <span className="text-white/40">—</span>
          const href = normalizeWebsiteHref(w)
          if (!href)
            return <span className="truncate text-xs text-white/60">{w}</span>
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-[200px] truncate text-xs text-sky-400 hover:text-sky-300 hover:underline"
            >
              {w}
            </a>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(row.original)}>
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-red-300 hover:text-red-200"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    `Delete “${row.original.name}”? This cannot be undone if no products reference this brand.`,
                  )
                )
                  return
                deleteMut.mutate(row.original.id)
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [openEdit, deleteMut],
  )

  const aliasRows = aliasRowsQ.data ?? []
  const aliasBusy = addAliasMut.isPending || removeAliasMut.isPending

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Brand manager</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/55">
              Manage catalog brands, logos, aliases, and hierarchy. Names are normalized on the server; slugs must stay
              unique.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={openAdd}>
              Add brand
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin">← Admin home</Link>
            </Button>
          </div>
        </div>

        {listQ.isLoading ? (
          <p className="text-sm text-white/55">Loading brands…</p>
        ) : listQ.isError ? (
          <p className="text-sm text-red-300">{getApiErrorMessage(listQ.error, 'Failed to load brands')}</p>
        ) : (
          <DataTable
            tableId="admin-brands"
            columns={columns}
            data={rows as (AdminBrandRow & Record<string, unknown>)[]}
            getRowId={(row) => String(row.id)}
            isLoading={false}
            emptyState={<p className="py-10 text-center text-sm text-white/50">No brands yet. Add one to get started.</p>}
            stickyHeader
          />
        )}
      </div>

      {drawerOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-label="Close drawer"
            onClick={closeDrawer}
          />
          <aside
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-lg flex-col border-l border-white/10 bg-[#0a1628] shadow-[0_0_40px_rgba(0,0,0,0.45)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-drawer-title"
          >
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 id="brand-drawer-title" className="text-lg font-semibold text-white">
                  {drawerMode === 'edit' ? 'Edit brand' : 'Add brand'}
                </h2>
                <p className="mt-0.5 text-xs text-white/45">
                  {drawerMode === 'edit' ? 'Update fields and save.' : 'Required fields are marked.'}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
                onClick={closeDrawer}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <Input
                label="Canonical name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SIEMENS"
                autoComplete="off"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => setName(formatBrandNameInput(name))}>
                  Format uppercase
                </Button>
              </div>

              <Input
                label="Slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
                placeholder="Derived from name if left blank on create"
                helperText={
                  drawerMode === 'add'
                    ? 'Updates from name until you edit this field.'
                    : 'Changing slug re-allocates a unique slug on save when needed.'
                }
              />

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-400/50"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                />
                <div>
                  <span className="text-sm font-semibold text-white">Verified brand</span>
                  <p className="text-xs text-white/45">Mark when the brand identity is confirmed in catalog.</p>
                </div>
              </label>

              <div>
                <label htmlFor="brand-parent" className="mb-2 block text-sm font-semibold text-white/90">
                  Parent brand
                </label>
                <select
                  id="brand-parent"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-orange-400/40 focus:ring-1 focus:ring-orange-400/30"
                  value={parentBrandId}
                  onChange={(e) => setParentBrandId(e.target.value)}
                >
                  <option value="">— None (top-level) —</option>
                  {parentOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-white/40">Subsidiaries can point to a parent brand.</p>
              </div>

              <Input
                label="Logo URL"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
              />
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">Preview</p>
                <div className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03]">
                  {logoUrl.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl.trim()}
                      alt="Logo preview"
                      className="max-h-16 max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-sm text-white/40">Enter a URL to preview</span>
                  )}
                </div>
              </div>

              <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
              <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Germany" />

              <div>
                <label htmlFor="brand-desc" className="mb-2 block text-sm font-semibold text-white/90">
                  Description <span className="text-white/40">(optional)</span>
                </label>
                <textarea
                  id="brand-desc"
                  className={adminLightTextareaClass}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short brand blurb"
                />
              </div>

              {drawerMode === 'edit' && editingId != null && (
                <div className="rounded-xl border border-orange-400/20 bg-orange-500/[0.06] p-4">
                  <p className="mb-3 text-sm font-semibold text-orange-200">Aliases</p>
                  {aliasRowsQ.isLoading ? (
                    <p className="text-xs text-white/50">Loading aliases…</p>
                  ) : aliasRowsQ.isError ? (
                    <p className="text-xs text-red-300">{getApiErrorMessage(aliasRowsQ.error, 'Failed to load aliases')}</p>
                  ) : (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {aliasRows.length === 0 ? (
                        <span className="text-xs text-white/45">No aliases yet.</span>
                      ) : (
                        aliasRows.map((al) => (
                          <span
                            key={al.id}
                            className={`${aliasChipClass} max-w-none gap-1.5 pr-1`}
                            title={al.alias_type ? `${al.alias} (${al.alias_type})` : al.alias}
                          >
                            <span className="truncate">{al.alias}</span>
                            <button
                              type="button"
                              className="rounded p-0.5 text-orange-300/80 hover:bg-orange-500/20 hover:text-white"
                              aria-label={`Remove alias ${al.alias}`}
                              disabled={removeAliasMut.isPending}
                              onClick={() => removeAliasMut.mutate({ aliasId: al.id })}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <Input
                        label="New alias"
                        value={newAlias}
                        onChange={(e) => setNewAlias(e.target.value)}
                        placeholder="e.g. Siemens AG"
                        disabled={aliasBusy}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      className="shrink-0"
                      disabled={aliasBusy || !newAlias.trim()}
                      loading={addAliasMut.isPending}
                      onClick={() => void addAliasMut.mutateAsync()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeDrawer}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  loading={savePending}
                  disabled={savePending || !name.trim()}
                  onClick={() => void handleSave()}
                >
                  {drawerMode === 'edit' ? 'Save changes' : 'Create brand'}
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
