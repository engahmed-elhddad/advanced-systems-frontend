"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

type BrandPattern = {
  id: number
  pattern: string
  brand_name: string
  description: string | null
  priority: number
  is_active: boolean
}

type CategoryPattern = {
  id: number
  pattern: string
  category_name: string
  description: string | null
  priority: number
  is_active: boolean
}

export default function PatternRulesAdminPage() {
  const [brands, setBrands] = useState<BrandPattern[]>([])
  const [categories, setCategories] = useState<CategoryPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"brand" | "category">("brand")

  // Brand form
  const [brandForm, setBrandForm] = useState({ pattern: "", brand_name: "", description: "", priority: 0 })
  const [brandSaving, setBrandSaving] = useState(false)

  // Category form
  const [categoryForm, setCategoryForm] = useState({ pattern: "", category_name: "", description: "", priority: 0 })
  const [categorySaving, setCategorySaving] = useState(false)

  const headers = () => ({
    "Content-Type": "application/json",
    "api-key": process.env.NEXT_PUBLIC_ADMIN_API_KEY || process.env.ADMIN_API_KEY || "ADVANCED_SYSTEMS_ADMIN",
  })

  async function loadBrands() {
    try {
      const res = await fetch(`${API}/admin/pattern-rules/brand`, { headers: headers() })
      const data = await res.json()
      setBrands(data.items ?? [])
    } catch {
      setBrands([])
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch(`${API}/admin/pattern-rules/category`, { headers: headers() })
      const data = await res.json()
      setCategories(data.items ?? [])
    } catch {
      setCategories([])
    }
  }

  useEffect(() => {
    Promise.all([loadBrands(), loadCategories()]).finally(() => setLoading(false))
  }, [])

  async function handleAddBrand(e: React.FormEvent) {
    e.preventDefault()
    if (!brandForm.pattern.trim() || !brandForm.brand_name.trim()) return
    setBrandSaving(true)
    try {
      await fetch(`${API}/admin/pattern-rules/brand`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          pattern: brandForm.pattern.trim(),
          brand_name: brandForm.brand_name.trim(),
          description: brandForm.description.trim() || null,
          priority: brandForm.priority,
        }),
      })
      setBrandForm({ pattern: "", brand_name: "", description: "", priority: 0 })
      await loadBrands()
    } catch {
      alert("Failed to add brand pattern")
    } finally {
      setBrandSaving(false)
    }
  }

  async function handleDeleteBrand(id: number) {
    if (!confirm("Deactivate this brand pattern?")) return
    try {
      await fetch(`${API}/admin/pattern-rules/brand/${id}`, { method: "DELETE", headers: headers() })
      await loadBrands()
    } catch {
      alert("Failed to deactivate")
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryForm.pattern.trim() || !categoryForm.category_name.trim()) return
    setCategorySaving(true)
    try {
      await fetch(`${API}/admin/pattern-rules/category`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          pattern: categoryForm.pattern.trim(),
          category_name: categoryForm.category_name.trim(),
          description: categoryForm.description.trim() || null,
          priority: categoryForm.priority,
        }),
      })
      setCategoryForm({ pattern: "", category_name: "", description: "", priority: 0 })
      await loadCategories()
    } catch {
      alert("Failed to add category pattern")
    } finally {
      setCategorySaving(false)
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm("Deactivate this category pattern?")) return
    try {
      await fetch(`${API}/admin/pattern-rules/category/${id}`, { method: "DELETE", headers: headers() })
      await loadCategories()
    } catch {
      alert("Failed to deactivate")
    }
  }

  const activeBrands = brands.filter((b) => b.is_active !== false)
  const activeCategories = categories.filter((c) => c.is_active !== false)

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Part Intelligence Pattern Rules</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage brand and category detection rules used by the part number parser
            </p>
          </div>
          <Link
            href="/admin/intelligence"
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition"
          >
            ← Part Intelligence
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("brand")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === "brand"
                ? "bg-teal-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Brand Patterns
          </button>
          <button
            onClick={() => setTab("category")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === "category"
                ? "bg-teal-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Category Patterns
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading…</div>
        ) : tab === "brand" ? (
          <div className="space-y-6">
            <form
              onSubmit={handleAddBrand}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap gap-4 items-end"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Pattern
                </label>
                <input
                  type="text"
                  value={brandForm.pattern}
                  onChange={(e) => setBrandForm((p) => ({ ...p, pattern: e.target.value.toUpperCase() }))}
                  placeholder="e.g. 3RT, LC1D"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono w-32"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandForm.brand_name}
                  onChange={(e) => setBrandForm((p) => ({ ...p, brand_name: e.target.value }))}
                  placeholder="e.g. Siemens"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={brandForm.description}
                  onChange={(e) => setBrandForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional note"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-48"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  value={brandForm.priority}
                  onChange={(e) => setBrandForm((p) => ({ ...p, priority: parseInt(e.target.value, 10) || 0 }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-20"
                />
              </div>
              <button
                type="submit"
                disabled={brandSaving || !brandForm.pattern.trim() || !brandForm.brand_name.trim()}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition"
              >
                {brandSaving ? "Adding…" : "Add Brand Pattern"}
              </button>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3">Pattern</th>
                    <th className="px-5 py-3">Brand</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBrands.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                        No brand patterns yet. Add rules above. Parser falls back to built-in rules when empty.
                      </td>
                    </tr>
                  )}
                  {activeBrands.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-teal-700">{r.pattern}</td>
                      <td className="px-5 py-3 font-medium">{r.brand_name}</td>
                      <td className="px-5 py-3 text-slate-500">{r.description ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-500">{r.priority}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleDeleteBrand(r.id)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <form
              onSubmit={handleAddCategory}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap gap-4 items-end"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Pattern
                </label>
                <input
                  type="text"
                  value={categoryForm.pattern}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, pattern: e.target.value.toUpperCase() }))}
                  placeholder="e.g. 3RT, E3JK"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono w-32"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryForm.category_name}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, category_name: e.target.value }))}
                  placeholder="e.g. Contactor"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional note"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-48"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  value={categoryForm.priority}
                  onChange={(e) =>
                    setCategoryForm((p) => ({ ...p, priority: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-20"
                />
              </div>
              <button
                type="submit"
                disabled={
                  categorySaving || !categoryForm.pattern.trim() || !categoryForm.category_name.trim()
                }
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition"
              >
                {categorySaving ? "Adding…" : "Add Category Pattern"}
              </button>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3">Pattern</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCategories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                        No category patterns yet. Add rules above. Parser falls back to built-in rules when
                        empty.
                      </td>
                    </tr>
                  )}
                  {activeCategories.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-teal-700">{r.pattern}</td>
                      <td className="px-5 py-3 font-medium">{r.category_name}</td>
                      <td className="px-5 py-3 text-slate-500">{r.description ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-500">{r.priority}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleDeleteCategory(r.id)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
