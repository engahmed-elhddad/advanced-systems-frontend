'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AlertTriangle, ImagePlus, LayoutList, Plus, Trash2, FileText, Upload } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button, Card, Input, Modal, Select } from '@/components/ui'
import { api, getApiErrorMessage } from '@/lib/api'
import { useAdminCategorySchema } from '@/features/products/hooks/useCategories'
import type {
  AdminProductFormInput,
  AdminProductSpec,
  AdminProductStatus,
} from '@/features/products/hooks/useProducts'

type ProductFormValues = AdminProductFormInput

type ProductFormProps = {
  initialValue: ProductFormValues
  mode: 'create' | 'edit'
  loading?: boolean
  brandOptions: Array<{ value: string; label: string }>
  categoryOptions: Array<{ value: string; label: string }>
  onSubmit: (value: ProductFormValues) => Promise<void> | void
}

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Draft', label: 'Draft' },
]
const FALLBACK_IMAGE = 'https://placehold.co/120x120/111827/9CA3AF?text=No+Img'

export function ProductForm({
  initialValue,
  mode,
  loading = false,
  brandOptions,
  categoryOptions,
  onSubmit,
}: ProductFormProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProductFormValues>(initialValue)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [brandModalOpen, setBrandModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingBrand, setCreatingBrand] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const submitInFlight = useRef(false)

  const categoryIdNum = Number(form.categoryId)
  const categorySchemaQuery = useAdminCategorySchema(form.categoryId)
  const schemaSpecKeys = useMemo(() => {
    const rows = categorySchemaQuery.data ?? []
    return rows
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((r) => (r.attribute?.label || r.attribute?.key || '').trim())
      .filter(Boolean)
  }, [categorySchemaQuery.data])

  const lastAutoCategoryRef = useRef<string>('')

  const previewImage = useMemo(() => form.imageUrl || FALLBACK_IMAGE, [form.imageUrl])

  const entryWarnings = useMemo(() => {
    const items: string[] = []
    if (!form.imageUrl?.trim()) items.push('Main image is missing (upload or paste an image URL).')
    if (!form.description?.trim()) items.push('Description is empty.')
    const brandOk = form.brandId?.trim() && brandOptions.some((o) => o.value === form.brandId)
    if (!brandOk) items.push('Brand is not selected (pick one from the list or create a new brand).')
    const catOk = form.categoryId?.trim() && categoryOptions.some((o) => o.value === form.categoryId)
    if (!catOk) items.push('Category is not selected (pick one from the list or create a new category).')
    return items
  }, [form.brandId, form.categoryId, form.description, form.imageUrl, brandOptions, categoryOptions])

  /** When category changes and the spec list is still empty, seed rows from category schema (per category id). */
  useEffect(() => {
    const cid = form.categoryId?.trim() ?? ''
    if (!cid || schemaSpecKeys.length === 0) return
    if (form.specs.length > 0) {
      lastAutoCategoryRef.current = cid
      return
    }
    if (lastAutoCategoryRef.current === cid) return
    lastAutoCategoryRef.current = cid
    setForm((f) => ({
      ...f,
      specs: schemaSpecKeys.map((key) => ({ key, value: '' })),
    }))
  }, [form.categoryId, form.specs.length, schemaSpecKeys])

  const applyCategorySpecTemplate = useCallback(() => {
    const cid = form.categoryId?.trim()
    if (!cid || !Number.isFinite(categoryIdNum) || categoryIdNum <= 0) {
      toast.error('Select a category first')
      return
    }
    if (schemaSpecKeys.length === 0) {
      toast.error('This category has no attribute schema yet. Define it under Admin → Categories → Schema.')
      return
    }
    const existingLower = new Set(
      form.specs.map((s) => s.key.trim().toLowerCase()).filter(Boolean),
    )
    const toAdd = schemaSpecKeys.filter((k) => !existingLower.has(k.trim().toLowerCase()))
    if (toAdd.length === 0) {
      toast.success('All schema fields are already in your specs list')
      return
    }
    setForm((f) => ({
      ...f,
      specs: [...f.specs, ...toAdd.map((key) => ({ key, value: '' }))],
    }))
    toast.success(`Added ${toAdd.length} spec row(s) from category schema`)
  }, [categoryIdNum, form.categoryId, form.specs, schemaSpecKeys])

  function patch(partial: Partial<ProductFormValues>) {
    setForm((f) => ({ ...f, ...partial }))
  }

  function patchSpec(index: number, partial: Partial<AdminProductSpec>) {
    setForm((f) => {
      const nextSpecs = [...f.specs]
      nextSpecs[index] = { ...nextSpecs[index], ...partial }
      return { ...f, specs: nextSpecs }
    })
  }

  function addSpec() {
    setForm((f) => ({ ...f, specs: [...f.specs, { key: '', value: '' }] }))
  }

  function removeSpec(index: number) {
    setForm((f) => ({ ...f, specs: f.specs.filter((_, i) => i !== index) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || loading || submitInFlight.current) return
    if (entryWarnings.length > 0) {
      const lines = entryWarnings.join('\n')
      const ok = window.confirm(
        `This product is missing recommended fields:\n\n${lines}\n\nSave anyway?`,
      )
      if (!ok) return
    }
    submitInFlight.current = true
    setSubmitting(true)
    try {
      await onSubmit({
        ...form,
        specs: form.specs.filter((s) => s.key.trim() || s.value.trim()),
      })
    } finally {
      setSubmitting(false)
      submitInFlight.current = false
    }
  }

  function onPickImage(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        patch({ imageUrl: reader.result })
      }
    }
    reader.readAsDataURL(file)
  }

  async function submitNewBrand() {
    const name = newBrandName.trim()
    if (!name) return
    setCreatingBrand(true)
    try {
      const res = await api.post<{ id: number }>('/api/v1/admin/brands', { name })
      const id = res.data?.id
      await queryClient.refetchQueries({ queryKey: ['brands'] })
      if (id != null) patch({ brandId: String(id) })
      toast.success('Brand created')
      setBrandModalOpen(false)
      setNewBrandName('')
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to create brand'))
    } finally {
      setCreatingBrand(false)
    }
  }

  async function submitNewCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    setCreatingCategory(true)
    try {
      const res = await api.post<{ id: number }>('/api/v1/admin/categories', { name })
      const id = res.data?.id
      await queryClient.refetchQueries({ queryKey: ['categories'] })
      if (id != null) patch({ categoryId: String(id) })
      toast.success('Category created')
      setCategoryModalOpen(false)
      setNewCategoryName('')
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to create category'))
    } finally {
      setCreatingCategory(false)
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="overflow-visible border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:p-8">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gray-300">Core Details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            variant="dark"
            label="Name"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Product name"
            required
          />

          <Select
            label="Brand"
            value={form.brandId}
            onChange={(value) => patch({ brandId: value })}
            options={brandOptions}
            addNew={{ label: '+ Add new brand', onClick: () => setBrandModalOpen(true) }}
          />

          <Select
            label="Category"
            value={form.categoryId}
            onChange={(value) => patch({ categoryId: value })}
            options={categoryOptions}
            addNew={{ label: '+ Add new category', onClick: () => setCategoryModalOpen(true) }}
          />

          <Select
            label="Status"
            value={form.status}
            onChange={(value) => patch({ status: value as AdminProductStatus })}
            options={STATUS_OPTIONS}
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-gray-200">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={4}
            placeholder="Write a concise product description..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/40"
          />
        </div>
      </Card>

      <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:p-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Specs</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              surface="dark"
              onClick={() => void applyCategorySpecTemplate()}
              disabled={categorySchemaQuery.isFetching}
            >
              <LayoutList className="h-4 w-4" />
              Add rows from category schema
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={addSpec}>
              <Plus className="h-4 w-4" />
              Add Spec
            </Button>
          </div>
        </div>
        {form.categoryId?.trim() && categorySchemaQuery.isSuccess && schemaSpecKeys.length === 0 ? (
          <p className="mb-3 text-xs text-gray-400">
            No schema attributes for this category yet. Add them under{' '}
            <Link href={`/admin/categories/${form.categoryId}/schema`} className="text-orange-300 underline hover:text-orange-200">
              Category schema
            </Link>{' '}
            to enable one-click spec rows.
          </p>
        ) : null}

        <div className="space-y-3">
          {form.specs.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
              No specs added yet.
            </div>
          ) : (
            form.specs.map((spec, index) => (
              <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-white/5 p-3 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  variant="dark"
                  placeholder="Key (e.g. Voltage)"
                  value={spec.key}
                  onChange={(e) => patchSpec(index, { key: e.target.value })}
                />
                <Input
                  variant="dark"
                  placeholder="Value (e.g. 24V DC)"
                  value={spec.value}
                  onChange={(e) => patchSpec(index, { value: e.target.value })}
                />
                <Button
                  type="button"
                  variant="destructive"
                  surface="dark"
                  size="sm"
                  aria-label={`Remove spec row ${index + 1}`}
                  onClick={() => removeSpec(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">Image</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Image
                src={previewImage}
                alt="Product preview"
                width={80}
                height={80}
                loading="lazy"
                unoptimized
                className="h-20 w-20 rounded-lg border border-white/10 object-cover"
              />
              <div className="text-sm text-gray-300">Preview</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Upload product image"
              className="hidden"
              onChange={(e) => onPickImage(e.target.files?.[0])}
            />
            <Button type="button" size="sm" variant="secondary" surface="dark" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload Image
            </Button>
            <Input
              variant="dark"
              label="Image URL"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={(e) => patch({ imageUrl: e.target.value })}
              leftIcon={<ImagePlus className="h-4 w-4" />}
            />
                    <p className="text-xs text-gray-400">Upload stores a temporary data URL until backend media upload is wired.</p>
          </div>
        </Card>

        <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">Datasheet</h2>
          <Input
            variant="dark"
            label="Datasheet URL"
            placeholder="https://..."
            value={form.datasheetUrl}
            onChange={(e) => patch({ datasheetUrl: e.target.value })}
            leftIcon={<FileText className="h-4 w-4" />}
          />
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          surface="dark"
          loading={submitting || loading}
          disabled={submitting || loading}
        >
          {mode === 'create' ? 'Save Product' : 'Save Changes'}
        </Button>
        <Button asChild type="button" variant="secondary" surface="dark">
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>

      <Modal open={brandModalOpen} onClose={() => setBrandModalOpen(false)} title="New brand" size="sm">
        <div className="space-y-3 py-2">
          <Input
            variant="dark"
            label="Brand name"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            placeholder="e.g. Siemens"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" surface="dark" onClick={() => setBrandModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" surface="dark" loading={creatingBrand} onClick={() => void submitNewBrand()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="New category" size="sm">
        <div className="space-y-3 py-2">
          <Input
            variant="dark"
            label="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g. PLCs"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" surface="dark" onClick={() => setCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" surface="dark" loading={creatingCategory} onClick={() => void submitNewCategory()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
