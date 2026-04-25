'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

import { DataTable, Badge, Button, Input } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api'
import {
  type AdminCategoryRow,
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '@/lib/admin-api'
import { formatCategoryNameInput } from '@/lib/brandCategoryFormat'
import { adminLightTextareaClass } from '@/lib/adminFormClasses'

const QKEY = ['admin-categories'] as const

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

type DrawerMode = 'add' | 'edit'

export default function AdminCategoriesPage() {
  const qc = useQueryClient()
  const listQ = useQuery({
    queryKey: QKEY,
    queryFn: async () => {
      const res = await fetchAdminCategories()
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
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState('')

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
    setDescription('')
    setParentId('')
    setDrawerOpen(true)
  }, [])

  const openEdit = useCallback((row: AdminCategoryRow) => {
    setDrawerMode('edit')
    setEditingId(row.id)
    setName(row.name)
    setSlug(row.slug ?? '')
    setSlugTouched(true)
    setDescription(row.description ?? '')
    setParentId(row.parent_id != null ? String(row.parent_id) : '')
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
      if (description.trim()) body.description = description.trim()
      if (parentId.trim()) body.parent_id = Number(parentId)
      const res = await createAdminCategory(body)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    onSuccess: () => {
      toast.success('Category created')
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
        description: description.trim() || null,
        parent_id: parentId.trim() ? Number(parentId) : null,
      }
      const slugTrim = slug.trim()
      if (slugTrim) body.slug = slugTrim
      const res = await updateAdminCategory(editingId, body)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    onSuccess: () => {
      toast.success('Category saved')
      void qc.invalidateQueries({ queryKey: QKEY })
      closeDrawer()
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e, 'Update failed')),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await deleteAdminCategory(id)
      if (!res.ok) throw new Error(res.message)
    },
    onSuccess: () => {
      toast.success('Category deleted')
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

  const categoryById = useMemo(() => {
    const map = new Map<number, AdminCategoryRow>()
    rows.forEach((c) => map.set(c.id, c))
    return map
  }, [rows])

  const parentOptions = useMemo(() => {
    return rows
      .filter((c) => (editingId == null ? true : c.id !== editingId))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [rows, editingId])

  const columns: ColumnDef<AdminCategoryRow & Record<string, unknown>, unknown>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium text-white">{row.original.name}</span>
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
        id: 'parent',
        header: 'Parent',
        cell: ({ row }) => {
          const pid = row.original.parent_id
          if (pid == null) return <span className="text-white/40">—</span>
          const parent = categoryById.get(pid)
          return <span className="text-sm text-white/70">{parent?.name ?? `#${pid}`}</span>
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
                    `Delete "${row.original.name}"? This will fail if child categories, attribute schema, or products reference it.`,
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
    [openEdit, deleteMut, categoryById],
  )

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Category manager</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/55">
              Manage catalog categories and hierarchy. Names are normalized on the server; slugs must stay unique.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={openAdd}>
              Add category
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin">← Admin home</Link>
            </Button>
          </div>
        </div>

        {listQ.isLoading ? (
          <p className="text-sm text-white/55">Loading categories…</p>
        ) : listQ.isError ? (
          <p className="text-sm text-red-300">{getApiErrorMessage(listQ.error, 'Failed to load categories')}</p>
        ) : (
          <DataTable
            tableId="admin-categories"
            columns={columns}
            data={rows as (AdminCategoryRow & Record<string, unknown>)[]}
            getRowId={(row) => String(row.id)}
            isLoading={false}
            emptyState={
              <p className="py-10 text-center text-sm text-white/50">No categories yet. Add one to get started.</p>
            }
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
            aria-labelledby="category-drawer-title"
          >
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 id="category-drawer-title" className="text-lg font-semibold text-white">
                  {drawerMode === 'edit' ? 'Edit category' : 'Add category'}
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
                label="Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. PLC"
                autoComplete="off"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setName(formatCategoryNameInput(name))}
                >
                  Format name
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

              <div>
                <label htmlFor="category-parent" className="mb-2 block text-sm font-semibold text-white/90">
                  Parent category
                </label>
                <select
                  id="category-parent"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-orange-400/40 focus:ring-1 focus:ring-orange-400/30"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">— None (top-level) —</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-white/40">Subcategories can point to a parent category.</p>
              </div>

              <div>
                <label htmlFor="category-desc" className="mb-2 block text-sm font-semibold text-white/90">
                  Description <span className="text-white/40">(optional)</span>
                </label>
                <textarea
                  id="category-desc"
                  className={adminLightTextareaClass}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short category description"
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
                  {drawerMode === 'edit' ? 'Save changes' : 'Create category'}
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
