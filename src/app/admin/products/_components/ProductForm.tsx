'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ImagePlus, LayoutList, Plus, Trash2, FileText, Upload, Search, Sparkles } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { BarcodeScanner } from '@/components/admin/BarcodeScanner'
import { EnrichmentSourceBadge } from '@/components/admin/EnrichmentSourceBadge'
import { Button, Card, Input, Modal, Select } from '@/components/ui'
import { api, adminApi, getApiErrorMessage } from '@/lib/api'
import { useAdminCategorySchema } from '@/features/products/hooks/useCategories'
import type {
  AdminProductCondition,
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
  /** Create: shown under Part number when API reports duplicate part_number. */
  partNumberError?: string | null
  onClearPartNumberError?: () => void
  /** Edit only — required to enable the "Upload to CDN" datasheet button. */
  productId?: number
}

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Draft', label: 'Draft' },
]

const LIFECYCLE_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'nrnd', label: 'NRND — Not Recommended for New Designs' },
  { value: 'obsolete', label: 'Obsolete' },
]

const CONDITION_OPTIONS: Array<{ value: AdminProductCondition; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'obsolete', label: 'Obsolete' },
]
const FALLBACK_IMAGE = 'https://placehold.co/120x120/111827/9CA3AF?text=No+Img'
/** Align with backend ``MAX_FILE_SIZE`` default (10 MB) for admin image pipeline. */
const MAX_PRODUCT_IMAGE_BYTES = 10 * 1024 * 1024

type EnrichmentPreviewResponse = {
  part_number: string
  fields: {
    brand: string | null
    category: string | null
    description: string | null
    series: string | null
    datasheet_url: string | null
    image_url: string | null
  }
  sources: Record<string, string>
  specs: Record<string, { value: string; source: string }>
  sources_tried: Array<{ source: string; ok: boolean; error?: string }>
}

function findOptionIdByName(
  options: Array<{ value: string; label: string }>,
  name: string,
): string | null {
  const target = name.trim().toLowerCase()
  if (!target) return null
  const exact = options.find((o) => o.label.trim().toLowerCase() === target)
  if (exact) return exact.value
  const sub = options.find(
    (o) =>
      o.label.toLowerCase().includes(target) || target.includes(o.label.toLowerCase()),
  )
  return sub?.value ?? null
}

export function ProductForm({
  initialValue,
  mode,
  loading = false,
  brandOptions,
  categoryOptions,
  onSubmit,
  partNumberError,
  onClearPartNumberError,
  productId,
}: ProductFormProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProductFormValues>(() => ({
    ...initialValue,
    partNumber: initialValue.partNumber ?? '',
  }))
  const [submitting, setSubmitting] = useState(false)
  const [datasheetUploading, setDatasheetUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const partNumberInputRef = useRef<HTMLInputElement>(null)
  const [brandModalOpen, setBrandModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingBrand, setCreatingBrand] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const submitInFlight = useRef(false)

  // ── MPN-first wizard state (create mode only) ────────────────────────────
  const [revealForm, setRevealForm] = useState(mode === 'edit')
  const [wizardMpn, setWizardMpn] = useState(initialValue.partNumber ?? '')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [enrichmentSources, setEnrichmentSources] = useState<Record<string, string>>({})
  const [lastLookupMpn, setLastLookupMpn] = useState<string | null>(null)
  const [sourcesTried, setSourcesTried] = useState<EnrichmentPreviewResponse['sources_tried']>([])
  const [wizardBarcodeOpen, setWizardBarcodeOpen] = useState(false)

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

  /** Blob preview for local `imageFile`; revoked on change/unmount. */
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [])

  const previewImage = useMemo(() => {
    if (imagePreviewUrl) return imagePreviewUrl
    const u = form.imageUrl?.trim() ?? ''
    if (u) return u
    return FALLBACK_IMAGE
  }, [form.imageUrl, imagePreviewUrl])

  const entryWarnings = useMemo(() => {
    const items: string[] = []
    const hasImage = Boolean(form.imageFile || form.imageUrl?.trim())
    if (!hasImage) items.push('Main image is missing (upload or paste an image URL).')
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

  // ── MPN-first wizard helpers ─────────────────────────────────────────────
  /** Drop a source tag for a field once the user edits it manually. */
  const clearSourceFor = useCallback((field: string) => {
    setEnrichmentSources((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  async function runLookup(mpn: string, opts: { confirmOverwrite?: boolean } = {}) {
    const pn = mpn.trim()
    if (!pn) {
      toast.error('Enter a part number first')
      return
    }
    if (opts.confirmOverwrite) {
      const ok = window.confirm(
        'Re-running lookup will overwrite the auto-filled fields you have not edited. Continue?',
      )
      if (!ok) return
    }
    setLookupLoading(true)
    try {
      const res = await api.post<EnrichmentPreviewResponse>(
        '/api/v1/admin/enrich/preview',
        { part_number: pn },
      )
      const data = res.data
      const fields = data?.fields ?? {}
      const sources = data?.sources ?? {}

      // Build the patch — only fill fields the user has not manually overridden.
      const patchObj: Partial<ProductFormValues> = { partNumber: pn }
      const nextSources: Record<string, string> = { ...enrichmentSources }

      // name defaults to part_number if blank
      if (!form.name?.trim() && pn) patchObj.name = pn

      if (fields.description) {
        if (!form.description?.trim() || enrichmentSources.description) {
          patchObj.description = fields.description
          if (sources.description) nextSources.description = sources.description
        }
      }
      if (fields.datasheet_url) {
        if (!form.datasheetUrl?.trim() || enrichmentSources.datasheet_url) {
          patchObj.datasheetUrl = fields.datasheet_url
          if (sources.datasheet_url) nextSources.datasheet_url = sources.datasheet_url
        }
      }
      if (fields.image_url) {
        if (!form.imageUrl?.trim() || enrichmentSources.image_url) {
          patchObj.imageUrl = fields.image_url
          patchObj.imageFile = undefined
          if (sources.image_url) nextSources.image_url = sources.image_url
        }
      }

      // Brand & category — fuzzy match against options.
      if (fields.brand) {
        const matched = findOptionIdByName(brandOptions, fields.brand)
        if (matched && (!form.brandId?.trim() || enrichmentSources.brandId)) {
          patchObj.brandId = matched
          if (sources.brand) nextSources.brandId = sources.brand
        } else if (!matched) {
          toast(`Brand "${fields.brand}" not found in catalog — add it manually.`, { icon: '⚠️' })
        }
      }
      if (fields.category) {
        const matched = findOptionIdByName(categoryOptions, fields.category)
        if (matched && (!form.categoryId?.trim() || enrichmentSources.categoryId)) {
          patchObj.categoryId = matched
          if (sources.category) nextSources.categoryId = sources.category
        } else if (!matched) {
          toast(`Category "${fields.category}" not found — add it manually.`, { icon: '⚠️' })
        }
      }

      // Specs from the structured Mouser/RS specs payload.
      const specEntries = Object.entries(data?.specs ?? {})
      if (specEntries.length > 0) {
        const existingKeys = new Set(form.specs.map((s) => s.key.trim().toLowerCase()))
        const newSpecs: AdminProductSpec[] = []
        for (const [key, payload] of specEntries) {
          if (!key || existingKeys.has(key.trim().toLowerCase())) continue
          const value =
            typeof payload === 'object' && payload && 'value' in payload
              ? String(payload.value ?? '')
              : ''
          if (value) newSpecs.push({ key, value })
        }
        if (newSpecs.length > 0) {
          patchObj.specs = [...form.specs.filter((s) => s.key.trim() || s.value.trim()), ...newSpecs]
        }
      }

      setForm((f) => ({ ...f, ...patchObj }))
      setEnrichmentSources(nextSources)
      setLastLookupMpn(pn)
      setSourcesTried(data?.sources_tried ?? [])
      setRevealForm(true)

      const filled = Object.keys(sources).length
      if (filled > 0) toast.success(`Auto-filled ${filled} field(s) from enrichment`)
      else toast(`No enrichment data found for ${pn}. Fill the form manually.`, { icon: '🔍' })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Enrichment failed'))
    } finally {
      setLookupLoading(false)
    }
  }

  function skipLookup() {
    if (wizardMpn.trim()) {
      setForm((f) => ({ ...f, partNumber: wizardMpn.trim() }))
    }
    setRevealForm(true)
  }

  // Detect MPN drift after a lookup — show "Re-lookup" hint.
  const mpnDriftedAfterLookup =
    mode === 'create' &&
    revealForm &&
    lastLookupMpn !== null &&
    (form.partNumber ?? '').trim().toUpperCase() !== lastLookupMpn.trim().toUpperCase()

  async function handleDatasheetUploadToCdn() {
    const url = form.datasheetUrl?.trim() ?? ''
    if (!productId || !url || datasheetUploading) return
    setDatasheetUploading(true)
    try {
      const res = await adminApi.products.uploadDatasheetFromUrl(productId, url)
      const newUrl = (res?.data as { datasheet_url?: string } | undefined)?.datasheet_url
      if (!newUrl) throw new Error('No datasheet_url returned')
      patch({ datasheetUrl: newUrl })
      toast.success('Datasheet uploaded to CDN')
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Datasheet upload failed'))
    } finally {
      setDatasheetUploading(false)
    }
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
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      toast.error('Image too large. Maximum size is 10 MB.')
      return
    }
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    patch({ imageFile: file, imageUrl: '' })
  }

  function onImageUrlChange(value: string) {
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    patch({ imageUrl: value, imageFile: undefined })
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

  // ── Render: MPN-first wizard (create mode, before lookup) ─────────────────
  if (mode === 'create' && !revealForm) {
    return (
      <>
        <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:p-8" data-testid="admin-product-form-mpn-wizard">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-300" aria-hidden />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
              Start with a part number
            </h2>
          </div>
          <p className="mb-4 text-sm text-gray-300">
            Type or scan the manufacturer part number (MPN). We will look it up across Mouser, RS Components,
            Radwell and more, then pre-fill the form so you only review and add stock details.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
            <div className="min-w-0 flex-1">
              <Input
                ref={partNumberInputRef}
                variant="dark"
                name="part_number_wizard"
                label="Part number (MPN)"
                value={wizardMpn}
                onChange={(e) => setWizardMpn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void runLookup(wizardMpn)
                  }
                }}
                placeholder="e.g. ATV320U07N4C"
                helperText="Press Enter or click Lookup."
                error={partNumberError ?? undefined}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              surface="dark"
              className="shrink-0"
              aria-label="Scan barcode for part number"
              onClick={() => setWizardBarcodeOpen(true)}
            >
              📷 Scan
            </Button>
            <Button
              type="button"
              surface="dark"
              className="shrink-0"
              loading={lookupLoading}
              disabled={!wizardMpn.trim() || lookupLoading}
              onClick={() => void runLookup(wizardMpn)}
            >
              <Search className="mr-1.5 h-4 w-4" />
              Lookup
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              surface="dark"
              size="sm"
              onClick={skipLookup}
            >
              Skip lookup — fill manually
            </Button>
          </div>
        </Card>
        <BarcodeScanner
          open={wizardBarcodeOpen}
          onClose={() => setWizardBarcodeOpen(false)}
          onDetect={(mpn) => {
            setWizardMpn(mpn)
            setWizardBarcodeOpen(false)
            void runLookup(mpn)
          }}
        />
      </>
    )
  }

  return (
    <>
    <form data-testid="admin-product-form" onSubmit={handleSubmit} className="space-y-6">
      {mode === 'create' && sourcesTried.length > 0 ? (
        <Card className="border border-orange-400/20 bg-orange-500/5 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-300" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-200">
              Enrichment sources tried
            </span>
            {sourcesTried.map((s, i) => (
              <span
                key={`${s.source}-${i}`}
                className={
                  s.ok
                    ? 'inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200'
                    : 'inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-400'
                }
                title={s.error ? `Error: ${s.error}` : s.ok ? 'Returned data' : 'No data'}
              >
                {s.ok ? '✓' : '·'} {s.source}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="overflow-visible border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:p-8">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gray-300">Core Details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={mode === 'edit' ? 'md:col-span-2' : undefined}>
            <Input
              variant="dark"
              label="Name"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Product name"
              required
            />
          </div>

          {mode === 'create' ? (
            <div>
              <PartNumberFieldWithScan
                inputRef={partNumberInputRef}
                value={form.partNumber ?? ''}
                error={partNumberError}
                onChange={(v) => patch({ partNumber: v })}
                onClearError={onClearPartNumberError}
              />
              {mpnDriftedAfterLookup ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-amber-300">
                    Part number changed since last lookup.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    surface="dark"
                    onClick={() => void runLookup(form.partNumber ?? '', { confirmOverwrite: true })}
                    loading={lookupLoading}
                  >
                    <Search className="mr-1.5 h-4 w-4" />
                    Re-lookup
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div>
            {enrichmentSources.brandId ? (
              <div className="mb-1 flex items-center justify-end">
                <EnrichmentSourceBadge source={enrichmentSources.brandId} />
              </div>
            ) : null}
            <Select
              label="Brand"
              value={form.brandId}
              onChange={(value) => {
                clearSourceFor('brandId')
                patch({ brandId: value })
              }}
              options={brandOptions}
              addNew={{ label: '+ Add new brand', onClick: () => setBrandModalOpen(true) }}
            />
          </div>

          <div>
            {enrichmentSources.categoryId ? (
              <div className="mb-1 flex items-center justify-end">
                <EnrichmentSourceBadge source={enrichmentSources.categoryId} />
              </div>
            ) : null}
            <Select
              label="Category"
              value={form.categoryId}
              onChange={(value) => {
                clearSourceFor('categoryId')
                patch({ categoryId: value })
              }}
              options={categoryOptions}
              addNew={{ label: '+ Add new category', onClick: () => setCategoryModalOpen(true) }}
            />
          </div>

          {categorySchemaQuery.isError ? (
            <p className="text-xs text-red-400 md:col-span-2">
              Could not load category spec schema. Add specs manually.
            </p>
          ) : null}

          <Select
            label="Status"
            value={form.status}
            onChange={(value) => patch({ status: value as AdminProductStatus })}
            options={STATUS_OPTIONS}
          />

          <Select
            label="Lifecycle"
            value={form.lifecycleStatus ?? 'active'}
            onChange={(value) => patch({ lifecycleStatus: value })}
            options={LIFECYCLE_OPTIONS}
          />
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-200">Description</label>
            <EnrichmentSourceBadge source={enrichmentSources.description} />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => {
              clearSourceFor('description')
              patch({ description: e.target.value })
            }}
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
            <div>
              {enrichmentSources.image_url ? (
                <div className="mb-1 flex items-center justify-end">
                  <EnrichmentSourceBadge source={enrichmentSources.image_url} />
                </div>
              ) : null}
              <Input
                variant="dark"
                label="Image URL"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => {
                  clearSourceFor('image_url')
                  onImageUrlChange(e.target.value)
                }}
                leftIcon={<ImagePlus className="h-4 w-4" />}
              />
            </div>
            <p className="text-xs text-gray-400">
              Upload sends the file to the server after save. Paste a URL here for an external image only.
            </p>
          </div>
        </Card>

        <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Datasheet</h2>
            <EnrichmentSourceBadge source={enrichmentSources.datasheet_url} />
          </div>
          <Input
            variant="dark"
            label="Datasheet URL"
            placeholder="https://..."
            value={form.datasheetUrl}
            onChange={(e) => {
              clearSourceFor('datasheet_url')
              patch({ datasheetUrl: e.target.value })
            }}
            leftIcon={<FileText className="h-4 w-4" />}
          />
          <div className="mt-3 flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              surface="dark"
              loading={datasheetUploading}
              disabled={
                !productId ||
                !form.datasheetUrl?.trim() ||
                datasheetUploading ||
                form.datasheetUrl.includes('cdn.advancedsystems-int.com')
              }
              onClick={() => void handleDatasheetUploadToCdn()}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Upload to CDN
            </Button>
            <p className="text-xs text-gray-400">
              {!productId
                ? 'Save the product first to enable upload.'
                : form.datasheetUrl?.includes('cdn.advancedsystems-int.com')
                  ? 'Already on our CDN.'
                  : 'Downloads the PDF from the URL above and stores it on our CDN.'}
            </p>
          </div>
        </Card>
      </div>

      {mode === 'create' ? (
        <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:p-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
            Inventory & Stock
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-200">Condition</label>
              <div className="flex flex-wrap gap-2">
                {CONDITION_OPTIONS.map((opt) => {
                  const checked = (form.condition ?? 'new') === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => patch({ condition: opt.value })}
                      className={
                        checked
                          ? 'rounded-full border border-orange-400/50 bg-orange-500/15 px-3 py-1.5 text-sm font-medium text-orange-100 shadow-[0_0_12px_rgba(251,146,60,0.18)]'
                          : 'rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-white/30 hover:text-white'
                      }
                      aria-pressed={checked}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <Input
              variant="dark"
              type="number"
              min={1}
              step={1}
              label="Quantity"
              value={String(form.quantity ?? 1)}
              onChange={(e) => {
                const n = Math.max(1, Math.floor(Number(e.target.value) || 1))
                patch({ quantity: n })
              }}
              helperText="عدد القطع المتاحة من نفس الـ MPN"
            />
            <Input
              variant="dark"
              type="number"
              min={0}
              step="0.01"
              label="Price (EGP)"
              value={form.priceEGP == null ? '' : String(form.priceEGP)}
              onChange={(e) => {
                const raw = e.target.value.trim()
                if (raw === '') patch({ priceEGP: null })
                else {
                  const n = Number(raw)
                  patch({ priceEGP: Number.isFinite(n) && n >= 0 ? n : null })
                }
              }}
              helperText="اختياري — ممكن يتحدد لاحقاً من قسم Offers"
            />
            <Input
              variant="dark"
              label="Shelf location"
              placeholder="A-3-12"
              value={form.shelfLocation ?? ''}
              onChange={(e) => patch({ shelfLocation: e.target.value })}
              helperText="موقع الرف في المحل (اختياري)"
            />
            <Input
              variant="dark"
              label="Bin label"
              placeholder="3119"
              value={form.binLabel ?? ''}
              onChange={(e) => patch({ binLabel: e.target.value })}
              helperText="رقم/كود الكرتونة المكتوب عليها (اختياري)"
            />
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          data-testid="admin-product-save"
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

type PartNumberFieldWithScanProps = {
  inputRef: React.Ref<HTMLInputElement>
  value: string
  error?: string | null
  onChange: (value: string) => void
  onClearError?: () => void
}

function PartNumberFieldWithScan({
  inputRef,
  value,
  error,
  onChange,
  onClearError,
}: PartNumberFieldWithScanProps) {
  const [barcodeOpen, setBarcodeOpen] = useState(false)
  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
        <div className="min-w-0 flex-1">
          <Input
            ref={inputRef}
            variant="dark"
            name="part_number"
            label="Part number"
            value={value}
            onChange={(e) => {
              onClearError?.()
              onChange(e.target.value)
            }}
            placeholder="Leave blank to auto-generate"
            helperText="Must be unique. Leave blank to generate from the product name."
            error={error ?? undefined}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          surface="dark"
          className="shrink-0"
          aria-label="Scan barcode for part number"
          onClick={() => setBarcodeOpen(true)}
        >
          📷 Scan
        </Button>
      </div>
      <BarcodeScanner
        open={barcodeOpen}
        onClose={() => setBarcodeOpen(false)}
        onDetect={(mpn) => {
          onClearError?.()
          onChange(mpn)
          setBarcodeOpen(false)
        }}
      />
    </>
  )
}
