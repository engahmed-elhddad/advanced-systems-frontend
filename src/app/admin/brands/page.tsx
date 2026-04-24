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
  fetchAdminBrands,
  createAdminBrand,
  updateAdminBrand,
  deleteAdminBrand,
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

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setEditingId(null)
    setSlugTouched(false)
  }, [])

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
    setDrawerOpen(true)
  }, [])

  useEffect(() => {
    if (drawerMode !== 'add' || slugTouched) return
    setSlug(slugFromName(name))
  }, [name, drawerMode, slugTouched])

  const createMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required')
      const body: Record<string, unknown> = { name: name.trim() }
      const s = slug.trim()
      if (s) body.slug = s
      if (logoUrl.trim()) body.logo_url = logoUrl.trim()
      if (website.trim()) body.website = website.trim()
      if (country.trim()) body.country = country.trim()
      if (description.trim()) body.description = description.trim()
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
        cell: ({ row }) => <span className="font-medium text-white">{row.original.name}</span>,
      },
      {
        id: 'slug',
        header: 'Slug',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-white/65">{row.original.slug ?? '—'}</span>
        ),
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

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Brand manager</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/55">
              Manage catalog brands, logos, and links. Names are normalized on the server; slugs must stay unique.
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
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col border-l border-white/10 bg-[#0a1628] shadow-[0_0_40px_rgba(0,0,0,0.45)]"
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
