"use client"

import { apiFetch } from '@/lib/api'

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getAuthHeaders } from "@/lib/admin-auth"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

interface AttrDef {
  id: number
  key: string
  label: string
  data_type: string
  unit: string | null
  filterable: boolean
  searchable: boolean
}

interface SchemaEntry {
  id: number
  attribute_definition_id: number
  is_required: boolean
  sort_order: number
  attribute: AttrDef
}

interface Category {
  id: number
  name: string
  slug: string
  path: string
}

export default function CategorySchemaPage() {
  const params = useParams()
  const categoryId = params.id as string

  const [category, setCategory] = useState<Category | null>(null)
  const [schema, setSchema] = useState<SchemaEntry[]>([])
  const [allAttrs, setAllAttrs] = useState<AttrDef[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [addingId, setAddingId] = useState<string>("")
  const [addRequired, setAddRequired] = useState(false)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState("")
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  function flash(type: "ok" | "err", text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3500)
  }

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      apiFetch(`${API}/api/v1/admin/categories/${categoryId}`, { headers: getAuthHeaders() }).then(r => r.json()),
      apiFetch(`${API}/api/v1/admin/categories/${categoryId}/schema`, { headers: getAuthHeaders() }).then(r => r.json()),
      apiFetch(`${API}/api/v1/admin/attributes`, { headers: getAuthHeaders() }).then(r => r.json()),
    ])
      .then(([cat, sch, attrs]) => {
        setCategory(cat)
        setSchema(Array.isArray(sch) ? sch : [])
        setAllAttrs(Array.isArray(attrs) ? attrs : [])
      })
      .catch(() => flash("err", "Failed to load data"))
      .finally(() => setLoading(false))
  }, [categoryId])

  useEffect(() => { load() }, [load])

  const assignedIds = new Set(schema.map(s => s.attribute_definition_id))
  const availableAttrs = allAttrs.filter(a => !assignedIds.has(a.id) &&
    (search === "" || a.label.toLowerCase().includes(search.toLowerCase()) || a.key.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleAdd() {
    if (!addingId) return
    setAdding(true)
    try {
      const res = await apiFetch(`${API}/api/v1/admin/categories/${categoryId}/schema`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          attribute_definition_id: Number(addingId),
          is_required: addRequired,
          sort_order: schema.length,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      flash("ok", "Attribute added")
      setAddingId("")
      setAddRequired(false)
      setSearch("")
      load()
    } catch {
      flash("err", "Failed to add attribute")
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(entryId: number) {
    try {
      const res = await apiFetch(`${API}/api/v1/admin/categories/${categoryId}/schema/${entryId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed")
      flash("ok", "Removed")
      load()
    } catch {
      flash("err", "Failed to remove")
    }
  }

  async function handleToggleRequired(entry: SchemaEntry) {
    setSaving(entry.id)
    try {
      const res = await apiFetch(`${API}/api/v1/admin/categories/${categoryId}/schema/${entry.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_required: !entry.is_required, sort_order: entry.sort_order }),
      })
      if (!res.ok) throw new Error("Failed")
      setSchema(prev => prev.map(s => s.id === entry.id ? { ...s, is_required: !s.is_required } : s))
    } catch {
      flash("err", "Save failed")
    } finally {
      setSaving(null)
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const newSchema = [...schema]
    const swapIdx = index + direction
    if (swapIdx < 0 || swapIdx >= newSchema.length) return
    const a = newSchema[index]
    const b = newSchema[swapIdx]
    if (a === undefined || b === undefined) return
    newSchema[index] = b
    newSchema[swapIdx] = a
    const updates = newSchema.map((s, i) => ({ id: s.id, sort_order: i }))
    setSchema(newSchema.map((s, i) => ({ ...s, sort_order: i })))

    try {
      await Promise.all(updates.map(u =>
        apiFetch(`${API}/api/v1/admin/categories/${categoryId}/schema/${u.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ sort_order: u.sort_order }),
        })
      ))
    } catch {
      flash("err", "Reorder failed")
      load()
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
  const TYPE_BADGE: Record<string, string> = {
    string: "bg-slate-100 text-slate-600",
    number: "bg-blue-50 text-blue-700",
    boolean: "bg-purple-50 text-purple-700",
    enum: "bg-amber-50 text-amber-700",
  }

  const breadcrumbs = category?.path ? category.path.split("/").filter(Boolean) : []

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/admin" className="text-slate-400 hover:text-slate-600 text-sm">← Dashboard</Link>
            <span className="text-slate-300">/</span>
            <Link href="/admin/attributes" className="text-slate-400 hover:text-slate-600 text-sm">Attributes</Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-2xl font-bold text-slate-900">
              {category ? `${category.name} — Schema` : "Category Schema"}
            </h1>
          </div>
        </div>

        {category && breadcrumbs.length > 0 && (
          <p className="text-sm text-slate-400 -mt-6 mb-6">
            Path: {breadcrumbs.join(" / ")}
          </p>
        )}

        {msg && (
          <div className={`mb-5 rounded-xl px-5 py-3 text-sm ${msg.type === "ok" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {msg.type === "ok" ? "✅" : "❌"} {msg.text}
          </div>
        )}

        {/* Add attribute */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">Add Attribute to Schema</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search attributes…"
                className={inputCls}
              />
              {search && availableAttrs.length > 0 && (
                <div className="border border-slate-200 rounded-lg mt-1 bg-white shadow-sm max-h-48 overflow-y-auto">
                  {availableAttrs.slice(0, 20).map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => { setAddingId(String(a.id)); setSearch("") }}
                      className="w-full text-left px-4 py-2 hover:bg-sky-50 text-sm flex items-center justify-between gap-2"
                    >
                      <span className="font-medium text-slate-800">{a.label}</span>
                      <span className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[a.data_type] || "bg-slate-100 text-slate-600"}`}>{a.data_type}</span>
                        <span className="text-slate-400 font-mono text-xs">{a.key}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {addingId && (
                <p className="mt-1.5 text-sm text-sky-700 font-medium">
                  Selected: {allAttrs.find(a => String(a.id) === addingId)?.label || addingId}
                  <button onClick={() => setAddingId("")} className="ml-2 text-slate-400 hover:text-slate-600 text-xs">✕ clear</button>
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 shrink-0 self-start mt-2 sm:mt-0 sm:pt-2">
              <input
                type="checkbox"
                checked={addRequired}
                onChange={e => setAddRequired(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              Required
            </label>
            <button
              onClick={handleAdd}
              disabled={!addingId || adding}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium transition shrink-0"
            >
              {adding ? "Adding…" : "Add"}
            </button>
          </div>
        </div>

        {/* Schema list */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">
              Assigned Attributes
              {!loading && <span className="ml-2 text-sm font-normal text-slate-400">({schema.length})</span>}
            </h2>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading…</div>
          ) : schema.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No attributes assigned yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {schema.map((entry, idx) => (
                <li key={entry.id} className="flex items-center gap-4 px-6 py-4">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0}
                      className="text-slate-300 hover:text-slate-500 disabled:opacity-20 text-xs leading-none"
                      title="Move up"
                    >▲</button>
                    <button
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === schema.length - 1}
                      className="text-slate-300 hover:text-slate-500 disabled:opacity-20 text-xs leading-none"
                      title="Move down"
                    >▼</button>
                  </div>

                  {/* Order badge */}
                  <span className="w-6 text-center text-xs text-slate-400 font-mono shrink-0">{idx + 1}</span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900 text-sm">{entry.attribute.label}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[entry.attribute.data_type] || "bg-slate-100 text-slate-600"}`}>
                        {entry.attribute.data_type}
                      </span>
                      {entry.attribute.unit && (
                        <span className="text-xs text-slate-400">({entry.attribute.unit})</span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400">{entry.attribute.key}</span>
                    <div className="flex gap-3 mt-1">
                      {entry.attribute.filterable && <span className="text-xs text-emerald-600">filterable</span>}
                      {entry.attribute.searchable && <span className="text-xs text-sky-600">searchable</span>}
                    </div>
                  </div>

                  {/* Required toggle */}
                  <button
                    onClick={() => handleToggleRequired(entry)}
                    disabled={saving === entry.id}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border transition shrink-0 ${
                      entry.is_required
                        ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {saving === entry.id ? "…" : entry.is_required ? "Required" : "Optional"}
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="text-slate-300 hover:text-red-500 transition text-sm shrink-0"
                    title="Remove from schema"
                  >✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
