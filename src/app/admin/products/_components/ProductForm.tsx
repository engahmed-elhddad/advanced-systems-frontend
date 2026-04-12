'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ImagePlus, Plus, Trash2, FileText, Upload } from 'lucide-react'
import { Button, Card, Input, Select } from '@/components/ui'
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
  const [form, setForm] = useState<ProductFormValues>(initialValue)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewImage = useMemo(() => form.imageUrl || FALLBACK_IMAGE, [form.imageUrl])

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
    setSubmitting(true)
    try {
      await onSubmit({
        ...form,
        specs: form.specs.filter((s) => s.key.trim() || s.value.trim()),
      })
    } finally {
      setSubmitting(false)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:p-8">
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
          />

          <Select
            label="Category"
            value={form.categoryId}
            onChange={(value) => patch({ categoryId: value })}
            options={categoryOptions}
          />

          <Select
            label="Status"
            value={form.status}
            onChange={(value) => patch({ status: value as AdminProductStatus })}
            options={STATUS_OPTIONS}
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-[#0B1F3A]">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={4}
            placeholder="Write a concise product description..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0B1F3A] placeholder:text-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/40"
          />
        </div>
      </Card>

      <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Specs</h2>
          <Button type="button" size="sm" variant="secondary" onClick={addSpec}>
            <Plus className="h-4 w-4" />
            Add Spec
          </Button>
        </div>

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
        <Button type="submit" surface="dark" loading={submitting || loading}>
          {mode === 'create' ? 'Save Product' : 'Save Changes'}
        </Button>
        <Button asChild type="button" variant="secondary" surface="dark">
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
