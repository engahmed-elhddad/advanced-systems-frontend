"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"
const ADMIN_KEY = "ADVANCED_SYSTEMS_ADMIN"

type Brand = { id: number; name: string; slug: string }
type Category = { id: number; name: string; slug: string }

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

  useEffect(() => {
    fetch(`${API}/brands`)
      .then(r => r.json())
      .then(d => setBrands(d.brands ?? []))
      .catch(() => setLoadError("Could not load brands from API."))
    fetch(`${API}/categories`)
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []))
      .catch(() => {/* brands error covers this */})
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
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
      const specifications: Record<string, string> = {}
      for (const s of specs) {
        if (s.key.trim()) specifications[s.key.trim()] = s.value.trim()
      }

      const body = {
        part_number: form.part_number.trim().toUpperCase(),
        brand_id: form.brand_id ? parseInt(form.brand_id) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        series: form.series || null,
        description: form.description || null,
        condition: form.condition,
        quantity: parseInt(form.quantity) || 0,
        availability: form.availability,
        lead_time: form.lead_time || null,
        specifications,
      }

      const res = await fetch(`${API}/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": ADMIN_KEY },
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
        await fetch(`${API}/admin/products/${productId}/images?is_primary=true`, {
          method: "POST",
          headers: { "api-key": ADMIN_KEY },
          body: fd,
        })
      }

      // Upload datasheet if provided
      if (datasheetFile && productId) {
        const fd = new FormData()
        fd.append("file", datasheetFile)
        await fetch(`${API}/admin/products/${productId}/datasheets`, {
          method: "POST",
          headers: { "api-key": ADMIN_KEY },
          body: fd,
        })
      }

      setStatus("success")
      setMessage(`Product ${product.part_number} created successfully (ID: ${productId})`)
      setForm({ part_number: "", brand_id: "", category_id: "", series: "", description: "", condition: "New", quantity: "0", availability: "On Request", lead_time: "" })
      setSpecs([])
      setImageFile(null)
      setDatasheetFile(null)
    } catch (err: unknown) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Unknown error")
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Part Number <span className="text-red-500">*</span></label>
              <input required name="part_number" value={form.part_number} onChange={handleChange}
                placeholder="e.g. 6ES7318-3EL01-0AB0"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                <select name="brand_id" value={form.brand_id} onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="">— Select Brand —</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select name="category_id" value={form.category_id} onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="">— Select Category —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Series</label>
              <input name="series" value={form.series} onChange={handleChange}
                placeholder="e.g. SIMATIC S7-400"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={3} placeholder="Product description…"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
          </section>

          {/* Stock & Availability */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2">Stock & Availability</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                <select name="condition" value={form.condition} onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option>New</option>
                  <option>Used</option>
                  <option>Refurbished</option>
                  <option>As Is</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
                <select name="availability" value={form.availability} onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option>In Stock</option>
                  <option>On Request</option>
                  <option>Limited Stock</option>
                  <option>Out of Stock</option>
                  <option>Pre-Order</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lead Time</label>
              <input name="lead_time" value={form.lead_time} onChange={handleChange}
                placeholder="e.g. 3-5 business days"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input value={s.value} onChange={e => updateSpec(i, "value", e.target.value)}
                  placeholder="Value (e.g. 24V DC)"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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

          <button type="submit" disabled={status === "loading"}
            className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition">
            {status === "loading" ? "Saving…" : "Save Product"}
          </button>
        </form>
      </div>
    </div>
  )
}
