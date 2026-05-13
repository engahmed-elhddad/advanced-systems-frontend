"use client"

import { api, apiFetch, getApiErrorMessage } from '@/lib/api'
import { getAuthHeaders } from "@/lib/admin-auth"
import { adminLightInputClass, adminLightLabelClass, adminLightTextareaClass } from '@/lib/adminFormClasses'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import toast from 'react-hot-toast'

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

type Brand = { id: number; name: string; slug: string }
type Category = { id: number; name: string; slug: string }

const CONDITION_OPTIONS = [
  { value: 'New', label: 'New' },
  { value: 'Used', label: 'Used' },
  { value: 'Refurbished', label: 'Refurbished' },
  { value: 'As Is', label: 'As Is' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'In Stock', label: 'In Stock' },
  { value: 'On Request', label: 'On Request' },
  { value: 'Limited Stock', label: 'Limited Stock' },
  { value: 'Out of Stock', label: 'Out of Stock' },
  { value: 'Pre-Order', label: 'Pre-Order' },
]

export default function AddProductPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    part_number: "",
    brand_id: "",
    category_id: "",
    series: "",
    description: "",
    condition: "New",
    quantity: "0",
    availability: "On Request",
    lead_time: "",
  })
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [loadError, setLoadError] = useState("")
  const [brandModalOpen, setBrandModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newBrandName, setNewBrandName] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [creatingBrand, setCreatingBrand] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)

  const brandSelectOptions = useMemo(
    () => brands.map((b) => ({ value: String(b.id), label: b.name })),
    [brands]
  )
  const categorySelectOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories]
  )

  useEffect(() => {
    apiFetch(`${API}/brands`)
      .then(r => r.json())
      .then(d => setBrands(d.brands ?? []))
      .catch(() => setLoadError("Could not load brands from API."))
    apiFetch(`${API}/categories`)
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []))
      .catch(() => {/* brands error covers this */})
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function submitNewBrand() {
    const name = newBrandName.trim()
    if (!name) return
    setCreatingBrand(true)
    try {
      const res = await api.post<{ id: number }>('/api/v1/admin/brands', { name })
      const id = res.data?.id
      if (id != null) {
        setBrands((prev) => [...prev, { id, name, slug: name.toLowerCase().replace(/\s+/g, '-') }])
        setForm((f) => ({ ...f, brand_id: String(id) }))
      }
      toast.success('Brand created')
      setBrandModalOpen(false)
      setNewBrandName('')
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to create brand (admin login may be required)'))
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
      if (id != null) {
        setCategories((prev) => [...prev, { id, name, slug: name.toLowerCase().replace(/\s+/g, '-') }])
        setForm((f) => ({ ...f, category_id: String(id) }))
      }
      toast.success('Category created')
      setCategoryModalOpen(false)
      setNewCategoryName('')
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to create category (admin login may be required)'))
    } finally {
      setCreatingCategory(false)
    }
  }

  function addSpec() {
    setSpecs(prev => [...prev, { key: "", value: "" }])
  }

  function updateSpec(index: number, field: "key" | "value", val: string) {
    setSpecs(prev => prev.map((s, i) => i === index ? { ...s, [field]: val } : s))
  }

  function removeSpec(index: number) {
    setSpecs(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      const specifications = specs
        .filter((s) => s.key.trim())
        .map((s, index) => ({ key: s.key.trim(), value: s.value.trim(), sort_order: index }))

      const body = {
        part_number: form.part_number.trim().toUpperCase(),
        name: form.part_number.trim().toUpperCase(),
        brand_id: form.brand_id ? parseInt(form.brand_id) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        series: form.series || null,
        description: form.description || null,
        condition: form.condition,
        stock_quantity: parseInt(form.quantity) || 1,
        initial_quantity: parseInt(form.quantity) || 1,
        availability: form.availability,
        specs: specifications,
      }

      const res = await apiFetch(`${API}/api/v1/admin/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Failed to create product")
      }

      const product = await res.json()
      const productId = product.id

      // Upload image if provided
      if (imageFile && productId) {
        const fd = new FormData()
        fd.append("file", imageFile)
        fd.append("is_primary", "true")
        const headers = getAuthHeaders()
        delete headers["Content-Type"]
        await apiFetch(`${API}/api/v1/admin/products/${productId}/images`, {
          method: "POST",
          headers,
          body: fd,
        })
      }

      // Upload datasheet if provided
      if (datasheetFile && productId) {
        const fd = new FormData()
        fd.append("file", datasheetFile)
        const headers = getAuthHeaders()
        delete headers["Content-Type"]
        await apiFetch(`${API}/api/v1/admin/products/${productId}/datasheets`, {
          method: "POST",
          headers,
          body: fd,
        })
      }

      setStatus("success")
      setMessage(`Product ${product.part_number} created successfully (ID: ${productId})`)
      toast.success(`Product ${product.part_number} created`)
      setForm({ part_number: "", brand_id: "", category_id: "", series: "", description: "", condition: "New", quantity: "0", availability: "On Request", lead_time: "" })
      setSpecs([])
      setImageFile(null)
      setDatasheetFile(null)
    } catch (err: unknown) {
      setStatus("error")
      const m = err instanceof Error ? err.message : "Unknown error"
      setMessage(m)
      toast.error(m)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-slate-400 hover:text-slate-600 transition text-sm">← Dashboard</Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-2xl font-bold text-slate-900">Add Product</h1>
        </div>

        {status === "success" && (
          <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-700">
            ✅ {message}
          </div>
        )}
        {status === "error" && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
            ❌ {message}
          </div>
        )}
        {loadError && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-700">
            ⚠️ {loadError} Brand/category dropdowns may be empty.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2">Basic Information</h2>
            <div>
              <label className={adminLightLabelClass}>Part Number <span className="text-red-500">*</span></label>
              <input required name="part_number" value={form.part_number} onChange={handleChange}
                placeholder="e.g. 6ES7318-3EL01-0AB0"
                className={adminLightInputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                variant="light"
                label="Brand"
                placeholder="— Select Brand —"
                value={form.brand_id}
                onChange={(v) => setForm((prev) => ({ ...prev, brand_id: v }))}
                options={brandSelectOptions}
                addNew={{ label: '+ Add new brand', onClick: () => setBrandModalOpen(true) }}
              />
              <Select
                variant="light"
                label="Category"
                placeholder="— Select Category —"
                value={form.category_id}
                onChange={(v) => setForm((prev) => ({ ...prev, category_id: v }))}
                options={categorySelectOptions}
                addNew={{ label: '+ Add new category', onClick: () => setCategoryModalOpen(true) }}
              />
            </div>
            <div>
              <label className={adminLightLabelClass}>Series</label>
              <input name="series" value={form.series} onChange={handleChange}
                placeholder="e.g. SIMATIC S7-400"
                className={adminLightInputClass}
              />
            </div>
            <div>
              <label className={adminLightLabelClass}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={3} placeholder="Product description…"
                className={adminLightTextareaClass}
              />
            </div>
          </section>

          {/* Stock & Availability */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2">Stock & Availability</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                variant="light"
                label="Condition"
                value={form.condition}
                onChange={(v) => setForm((prev) => ({ ...prev, condition: v }))}
                options={CONDITION_OPTIONS}
              />
              <div>
                <label className={adminLightLabelClass}>Quantity</label>
                <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange}
                  className={adminLightInputClass}
                />
              </div>
              <Select
                variant="light"
                label="Availability"
                value={form.availability}
                onChange={(v) => setForm((prev) => ({ ...prev, availability: v }))}
                options={AVAILABILITY_OPTIONS}
              />
            </div>
            <div>
              <label className={adminLightLabelClass}>Lead Time</label>
              <input name="lead_time" value={form.lead_time} onChange={handleChange}
                placeholder="e.g. 3-5 business days"
                className={adminLightInputClass}
              />
            </div>
          </section>

          {/* Specifications */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-base font-semibold text-slate-800">Specifications</h2>
              <button type="button" onClick={addSpec}
                className="text-sm text-sky-600 hover:text-sky-700 font-medium transition">
                + Add Spec
              </button>
            </div>
            {specs.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-2">No specifications added.</p>
            )}
            {specs.map((s, i) => (
              <div key={i} className="flex gap-3 items-center">
                <input value={s.key} onChange={e => updateSpec(i, "key", e.target.value)}
                  placeholder="Key (e.g. Voltage)"
                  className={`${adminLightInputClass} flex-1`}
                />
                <input value={s.value} onChange={e => updateSpec(i, "value", e.target.value)}
                  placeholder="Value (e.g. 24V DC)"
                  className={`${adminLightInputClass} flex-1`}
                />
                <button type="button" onClick={() => removeSpec(i)}
                  className="text-red-400 hover:text-red-600 transition px-2">✕</button>
              </div>
            ))}
          </section>

          {/* Media */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2">Media</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Image</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 file:transition"
              />
              {imageFile && <p className="mt-1 text-xs text-slate-500">Selected: {imageFile.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Datasheet (PDF)</label>
              <input type="file" accept="application/pdf" onChange={e => setDatasheetFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 file:transition"
              />
              {datasheetFile && <p className="mt-1 text-xs text-slate-500">Selected: {datasheetFile.name}</p>}
            </div>
          </section>

          <Button type="submit" variant="primary" fullWidth disabled={status === "loading"} loading={status === "loading"}>
            Save Product
          </Button>
        </form>

        <Modal open={brandModalOpen} onClose={() => setBrandModalOpen(false)} title="New brand" size="sm">
          <div className="space-y-3 py-2">
            <Input label="Brand name" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="e.g. Siemens" />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setBrandModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" loading={creatingBrand} onClick={() => void submitNewBrand()}>
                Create
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="New category" size="sm">
          <div className="space-y-3 py-2">
            <Input label="Category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. PLCs" />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" loading={creatingCategory} onClick={() => void submitNewCategory()}>
                Create
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
