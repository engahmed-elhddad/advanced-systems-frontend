"use client"

import { apiFetch } from '@/lib/api'

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from '@/lib/utils'
import { getAuthHeaders } from "@/lib/admin-auth"
import { Select } from '@/components/ui/Select'

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

type DataType = "string" | "number" | "boolean" | "enum"

interface AttrDef {
  id: number
  key: string
  label: string
  data_type: DataType
  unit: string | null
  allowed_values: string | null
  filterable: boolean
  searchable: boolean
  show_on_card: boolean
  sort_order: number
  is_active: boolean
}

const EMPTY_FORM = {
  key: "",
  label: "",
  data_type: "string" as DataType,
  unit: "",
  allowed_values: "",
  filterable: false,
  searchable: false,
  show_on_card: false,
  sort_order: 0,
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-sky-600" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-1"}`} />
    </button>
  )
}

export default function AttributeManagerPage() {
  const [attrs, setAttrs] = useState<AttrDef[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editForm, setEditForm] = useState<Partial<AttrDef>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  function load() {
    setLoading(true)
    apiFetch(`${API}/api/v1/admin/attributes?include_inactive=true`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => setAttrs(Array.isArray(d) ? d : []))
      .catch(() => setAttrs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function flash(type: "ok" | "err", text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3500)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        unit: form.unit || null,
        allowed_values: form.allowed_values || null,
        sort_order: Number(form.sort_order),
      }
      const res = await apiFetch(`${API}/api/v1/admin/attributes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? "Failed")
      }
      flash("ok", "Attribute created")
      setShowCreate(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err: unknown) {
      flash("err", err instanceof Error ? err.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id: number) {
    setSaving(true)
    try {
      const res = await apiFetch(`${API}/api/v1/admin/attributes/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error("Failed")
      flash("ok", "Saved")
      setEditId(null)
      load()
    } catch {
      flash("err", "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id: number, active: boolean) {
    const res = await apiFetch(`${API}/api/v1/admin/attributes/${id}`, {
      method: active ? "DELETE" : "PUT",
      headers: getAuthHeaders(),
      body: active ? undefined : JSON.stringify({ is_active: true }),
    })
    if (res.ok) { flash("ok", active ? "Deactivated" : "Reactivated"); load() }
    else flash("err", "Failed")
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
  const checkCls = "w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-slate-600 text-sm">← Dashboard</Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-2xl font-bold text-slate-900">Attribute Manager</h1>
          </div>
          <button
            onClick={() => { setShowCreate(v => !v); setForm(EMPTY_FORM) }}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition"
          >
            {showCreate ? "Cancel" : "+ New Attribute"}
          </button>
        </div>

        {msg && (
          <div className={`mb-5 rounded-xl px-5 py-3 text-sm ${msg.type === "ok" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {msg.type === "ok" ? "✅" : "❌"} {msg.text}
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2">New Attribute</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Key <span className="text-red-500">*</span></label>
                <input required value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))}
                  placeholder="snake_case e.g. rated_voltage" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label <span className="text-red-500">*</span></label>
                <input required value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. Rated Voltage" className={inputCls} />
              </div>
              <Select
                variant="light"
                label="Data Type"
                value={form.data_type}
                onChange={(v) => setForm((p) => ({ ...p, data_type: v as DataType }))}
                options={[
                  { value: 'string', label: 'String' },
                  { value: 'number', label: 'Number' },
                  { value: 'boolean', label: 'Boolean' },
                  { value: 'enum', label: 'Enum' },
                ]}
                triggerClassName={cn(inputCls, 'h-auto min-h-[42px] w-full justify-between')}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  placeholder="e.g. V, A, W" className={inputCls} />
              </div>
              {form.data_type === "enum" && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Allowed Values (JSON array)</label>
                  <input value={form.allowed_values} onChange={e => setForm(p => ({ ...p, allowed_values: e.target.value }))}
                    placeholder='["DIN Rail", "Panel Mount"]' className={inputCls} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} className={inputCls} />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 pt-1">
              {(["filterable", "searchable", "show_on_card"] as const).map(field => (
                <label key={field} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.checked }))} className={checkCls} />
                  {field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </label>
              ))}
            </div>
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-sm font-medium transition">
              {saving ? "Saving…" : "Create Attribute"}
            </button>
          </form>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading…</div>
          ) : !attrs.length ? (
            <div className="p-10 text-center text-slate-400">No attributes yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Key", "Label", "Type", "Unit", "Filterable", "Searchable", "Card", "Order", "Active", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attrs.map(attr => (
                    editId === attr.id ? (
                      <tr key={attr.id} className="border-b border-slate-100 bg-sky-50">
                        <td className="px-4 py-2 font-mono text-slate-500 text-xs">{attr.key}</td>
                        <td className="px-4 py-2">
                          <input value={editForm.label ?? ""} onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </td>
                        <td className="px-4 py-2 text-slate-500">{attr.data_type}</td>
                        <td className="px-4 py-2">
                          <input value={editForm.unit ?? ""} onChange={e => setEditForm(p => ({ ...p, unit: e.target.value }))}
                            className="w-20 px-2 py-1.5 rounded border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </td>
                        {(["filterable", "searchable", "show_on_card"] as const).map(f => (
                          <td key={f} className="px-4 py-2 text-center">
                            <Toggle checked={!!(editForm as any)[f]} onChange={() => setEditForm(p => ({ ...p, [f]: !(p as any)[f] }))} />
                          </td>
                        ))}
                        <td className="px-4 py-2">
                          <input type="number" value={editForm.sort_order ?? 0} onChange={e => setEditForm(p => ({ ...p, sort_order: Number(e.target.value) }))}
                            className="w-16 px-2 py-1.5 rounded border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </td>
                        <td className="px-4 py-2 text-center text-slate-400">—</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <button onClick={() => handleUpdate(attr.id)} disabled={saving}
                            className="mr-2 text-sky-600 hover:text-sky-700 text-xs font-medium disabled:opacity-50">Save</button>
                          <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={attr.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${!attr.is_active ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3 font-mono text-slate-700 text-xs">{attr.key}</td>
                        <td className="px-4 py-3 text-slate-900">{attr.label}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{attr.data_type}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{attr.unit ?? "—"}</td>
                        {(["filterable", "searchable", "show_on_card"] as const).map(f => (
                          <td key={f} className="px-4 py-3 text-center">
                            <span className={`text-xs font-medium ${(attr as any)[f] ? "text-emerald-600" : "text-slate-300"}`}>
                              {(attr as any)[f] ? "✓" : "—"}
                            </span>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-slate-500 text-center">{attr.sort_order}</td>
                        <td className="px-4 py-3 text-center">
                          <Toggle checked={attr.is_active} onChange={() => handleDeactivate(attr.id, attr.is_active)} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button onClick={() => {
                            setEditId(attr.id)
                            setEditForm({ label: attr.label, unit: attr.unit ?? "", filterable: attr.filterable, searchable: attr.searchable, show_on_card: attr.show_on_card, sort_order: attr.sort_order })
                          }} className="text-sky-600 hover:text-sky-700 text-xs font-medium mr-2">Edit</button>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
