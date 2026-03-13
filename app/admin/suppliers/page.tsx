"use client"

import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

type Supplier = {
  id: number
  name: string
  country: string
  email: string
  website?: string
  notes?: string
}

const EMPTY_SUPPLIER: Omit<Supplier, "id"> = { name: "", country: "", email: "", website: "", notes: "" }

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Omit<Supplier, "id">>(EMPTY_SUPPLIER)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch(`${API}/admin/suppliers`, { headers: { "api-key": "ADVANCED_SYSTEMS_ADMIN" } })
      .then(r => r.json())
      .then(d => setSuppliers(d.suppliers ?? d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch(`${API}/admin/suppliers/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "api-key": "ADVANCED_SYSTEMS_ADMIN" },
          body: JSON.stringify(form),
        })
        const updated = await res.json()
        setSuppliers(prev => prev.map(s => s.id === editing.id ? { ...updated } : s))
      } else {
        const res = await fetch(`${API}/admin/suppliers`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": "ADVANCED_SYSTEMS_ADMIN" },
          body: JSON.stringify(form),
        })
        const created = await res.json()
        setSuppliers(prev => [...prev, created])
      }
      setForm(EMPTY_SUPPLIER)
      setEditing(null)
      setShowForm(false)
    } catch {
      alert("Failed to save supplier")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this supplier?")) return
    try {
      await fetch(`${API}/admin/suppliers/${id}`, {
        method: "DELETE",
        headers: { "api-key": "ADVANCED_SYSTEMS_ADMIN" },
      })
      setSuppliers(prev => prev.filter(s => s.id !== id))
    } catch {
      alert("Failed to delete")
    }
  }

  function startEdit(s: Supplier) {
    setEditing(s)
    setForm({ name: s.name, country: s.country, email: s.email, website: s.website ?? "", notes: s.notes ?? "" })
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Supplier Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage your verified supplier network</p>
          </div>
          <button
            onClick={() => { setEditing(null); setForm(EMPTY_SUPPLIER); setShowForm(true) }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition"
          >
            + Add Supplier
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading…</div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {suppliers.length === 0 ? (
              <div className="text-center py-20 text-slate-400">No suppliers added yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Country</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Website</th>
                      <th className="px-5 py-3">Notes</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(s => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                        <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                        <td className="px-5 py-3 text-slate-600">{s.country}</td>
                        <td className="px-5 py-3">
                          <a href={`mailto:${s.email}`} className="text-sky-600 hover:underline">{s.email}</a>
                        </td>
                        <td className="px-5 py-3">
                          {s.website ? (
                            <a href={s.website} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline truncate max-w-[150px] block">{s.website.replace(/^https?:\/\//, "")}</a>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-3 text-slate-500 truncate max-w-[200px]">{s.notes || "—"}</td>
                        <td className="px-5 py-3 flex gap-3">
                          <button onClick={() => startEdit(s)} className="text-xs font-medium text-sky-600 hover:text-sky-800 transition">Edit</button>
                          <button onClick={() => handleDelete(s.id)} className="text-xs font-medium text-red-500 hover:text-red-700 transition">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-5">{editing ? "Edit Supplier" : "Add Supplier"}</h2>
              <div className="space-y-3 mb-5">
                {(["name", "country", "email", "website"] as const).map(field => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">{field.replace("_", " ")}</label>
                    <input
                      name={field}
                      type={field === "email" ? "email" : "text"}
                      value={form[field] ?? ""}
                      onChange={handleChange}
                      required={field !== "website"}
                      placeholder={field === "website" ? "https://example.com" : ""}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={form.notes ?? ""}
                    onChange={handleChange}
                    placeholder="Specialties, certifications, terms…"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowForm(false); setEditing(null) }} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name || !form.email}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold disabled:opacity-60 transition"
                >
                  {saving ? "Saving…" : editing ? "Update" : "Add Supplier"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
