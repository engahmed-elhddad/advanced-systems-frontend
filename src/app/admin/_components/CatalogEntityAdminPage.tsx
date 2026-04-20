'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/api'
import * as admin from '@/lib/admin-api'
import { formatBrandNameInput, formatCategoryNameInput } from '@/lib/brandCategoryFormat'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { adminLightInputClass, adminLightLabelClass, adminLightTextareaClass } from '@/lib/adminFormClasses'

type Kind = 'brand' | 'category'

type Row = admin.AdminBrandRow | admin.AdminCategoryRow

export function CatalogEntityAdminPage({
  kind,
  title,
  description,
}: {
  kind: Kind
  title: string
  description: string
}) {
  const qc = useQueryClient()
  const qKey = kind === 'brand' ? (['admin-brands'] as const) : (['admin-categories'] as const)

  const listQ = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const res = kind === 'brand' ? await admin.fetchAdminBrands() : await admin.fetchAdminCategories()
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [name, setName] = useState('')
  const [slugOverride, setSlugOverride] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [website, setWebsite] = useState('')
  const [country, setCountry] = useState('')
  const [catDescription, setCatDescription] = useState('')
  const [parentId, setParentId] = useState<string>('')

  const formatName = kind === 'brand' ? formatBrandNameInput : formatCategoryNameInput

  function openAdd() {
    setEditing(null)
    setName('')
    setSlugOverride('')
    setLogoUrl('')
    setWebsite('')
    setCountry('')
    setCatDescription('')
    setParentId('')
    setModalOpen(true)
  }

  function openEdit(row: Row) {
    setEditing(row)
    setName(row.name)
    setSlugOverride('')
    setLogoUrl((row as admin.AdminBrandRow).logo_url ?? '')
    setWebsite((row as admin.AdminBrandRow).website ?? '')
    setCountry((row as admin.AdminBrandRow).country ?? '')
    setCatDescription((row as admin.AdminCategoryRow).description ?? '')
    const pid = (row as admin.AdminCategoryRow).parent_id
    setParentId(pid != null && pid !== undefined ? String(pid) : '')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  const createMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required')
      const body: Record<string, unknown> = { name: name.trim() }
      if (slugOverride.trim()) body.slug = slugOverride.trim()
      if (kind === 'brand') {
        if (logoUrl.trim()) body.logo_url = logoUrl.trim()
        if (website.trim()) body.website = website.trim()
        if (country.trim()) body.country = country.trim()
      } else {
        if (catDescription.trim()) body.description = catDescription.trim()
        if (parentId.trim()) body.parent_id = Number(parentId)
      }
      const res = kind === 'brand' ? await admin.createAdminBrand(body) : await admin.createAdminCategory(body)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    onSuccess: () => {
      toast.success(kind === 'brand' ? 'Brand created' : 'Category created')
      void qc.invalidateQueries({ queryKey: qKey })
      closeModal()
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e, 'Create failed')),
  })

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error('Nothing to update')
      if (!name.trim()) throw new Error('Name is required')
      const body: Record<string, unknown> = { name: name.trim() }
      if (slugOverride.trim()) body.slug = slugOverride.trim()
      if (kind === 'brand') {
        body.logo_url = logoUrl.trim() || null
        body.website = website.trim() || null
        body.country = country.trim() || null
      } else {
        body.description = catDescription.trim() || null
        body.parent_id = parentId.trim() ? Number(parentId) : null
      }
      const res =
        kind === 'brand'
          ? await admin.updateAdminBrand(editing.id, body)
          : await admin.updateAdminCategory(editing.id, body)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    onSuccess: () => {
      toast.success('Saved')
      void qc.invalidateQueries({ queryKey: qKey })
      closeModal()
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e, 'Update failed')),
  })

  const savePending = createMut.isPending || updateMut.isPending

  async function handleModalSave() {
    if (savePending) return
    try {
      if (editing) await updateMut.mutateAsync()
      else await createMut.mutateAsync()
    } catch {
      /* toast via mutation onError */
    }
  }

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = kind === 'brand' ? await admin.deleteAdminBrand(id) : await admin.deleteAdminCategory(id)
      if (!res.ok) throw new Error(res.message)
    },
    onSuccess: () => {
      toast.success('Deleted')
      void qc.invalidateQueries({ queryKey: qKey })
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e, 'Delete failed')),
  })

  const rows = listQ.data ?? []

  const parentOptions = useMemo(() => {
    if (kind !== 'category') return []
    return (rows as admin.AdminCategoryRow[])
      .filter((c) => !editing || c.id !== editing.id)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [kind, rows, editing])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/60">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" onClick={openAdd}>
            Add {kind === 'brand' ? 'brand' : 'category'}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/admin">← Admin home</Link>
          </Button>
        </div>
      </div>

      {listQ.isLoading ? (
        <p className="text-sm text-white/55">Loading…</p>
      ) : listQ.isError ? (
        <p className="text-sm text-red-300">{getApiErrorMessage(listQ.error, 'Failed to load')}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <table className="w-full min-w-[520px] text-left text-sm text-white/90">
            <thead className="border-b border-white/10 bg-black/20 text-xs font-semibold uppercase tracking-wide text-white/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Products</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-white/50">
                    No {kind === 'brand' ? 'brands' : 'categories'} yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-white/65">{row.slug}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/75">{row.product_count ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(row)}>
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
                                `Delete “${row.name}”? This cannot be undone if the server allows deletion.`
                              )
                            )
                              return
                            deleteMut.mutate(row.id)
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit ${kind}` : `New ${kind}`}
        size="md"
      >
        <div className="space-y-4 p-1">
          <div>
            <label className={adminLightLabelClass} htmlFor="ce-name">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="ce-name"
              className={adminLightInputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === 'brand' ? 'e.g. IFM' : 'e.g. Pressure Sensors'}
              autoComplete="off"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setName(formatName(name))}>
                Auto-format
              </Button>
            </div>
          </div>

          <div>
            <label className={adminLightLabelClass} htmlFor="ce-slug">
              Custom slug (optional)
            </label>
            <input
              id="ce-slug"
              className={adminLightInputClass}
              value={slugOverride}
              onChange={(e) => setSlugOverride(e.target.value)}
              placeholder="Leave blank to derive from name"
            />
          </div>

          {kind === 'brand' ? (
            <>
              <div>
                <label className={adminLightLabelClass} htmlFor="ce-logo">
                  Logo URL
                </label>
                <input
                  id="ce-logo"
                  className={adminLightInputClass}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>
              <div>
                <label className={adminLightLabelClass} htmlFor="ce-web">
                  Website
                </label>
                <input
                  id="ce-web"
                  className={adminLightInputClass}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <div>
                <label className={adminLightLabelClass} htmlFor="ce-country">
                  Country
                </label>
                <input
                  id="ce-country"
                  className={adminLightInputClass}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={adminLightLabelClass} htmlFor="ce-parent">
                  Parent category
                </label>
                <select
                  id="ce-parent"
                  className={adminLightInputClass}
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">— None (root) —</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={adminLightLabelClass} htmlFor="ce-cdesc">
                  Description
                </label>
                <textarea
                  id="ce-cdesc"
                  className={adminLightTextareaClass}
                  rows={3}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={savePending}
              disabled={savePending}
              onClick={() => void handleModalSave()}
            >
              {editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
