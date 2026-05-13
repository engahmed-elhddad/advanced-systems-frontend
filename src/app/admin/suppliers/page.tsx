"use client"

import { useEffect, useState } from "react"
import { apiFetch } from '@/lib/api'
import { getAuthHeaders } from "@/lib/admin-auth"
import { Button, Input, Modal } from "@/components/ui"

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

type Supplier = {
  id: number
  name: string
  country?: string | null
  contact_email?: string | null
  website?: string
  notes?: string
}

type SupplierForm = {
  name: string
  country: string
  email: string
  website: string
  notes: string
}

const EMPTY_SUPPLIER: SupplierForm = { name: "", country: "", email: "", website: "", notes: "" }

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<SupplierForm>(EMPTY_SUPPLIER)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    apiFetch(`${API}/api/v1/suppliers/`)
      .then(r => r.json())
      .then(d => setSuppliers(Array.isArray(d) ? d : d.suppliers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        country: form.country.trim() || null,
        contact_email: form.email.trim() || null,
        website: form.website.trim() || null,
        notes: form.notes.trim() || null,
      }
      if (editing) {
        const res = await apiFetch(`${API}/api/v1/admin/suppliers/${editing.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })
        const updated = await res.json()
        setSuppliers(prev => prev.map(s => s.id === editing.id ? { ...updated } : s))
      } else {
        const res = await apiFetch(`${API}/api/v1/admin/suppliers`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
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
      await apiFetch(`${API}/api/v1/admin/suppliers/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      setSuppliers(prev => prev.filter(s => s.id !== id))
    } catch {
      alert("Failed to delete")
    }
  }

  function startEdit(s: Supplier) {
    setEditing(s)
    setForm({
      name: s.name,
      country: s.country ?? "",
      email: s.contact_email ?? "",
      website: s.website ?? "",
      notes: s.notes ?? "",
    })
    setShowForm(true)
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Supplier Management</h1>
            <p className="mt-0.5 text-sm text-white/50">Manage your verified supplier network</p>
          </div>
          <Button
            variant="primary"
            onClick={() => { setEditing(null); setForm(EMPTY_SUPPLIER); setShowForm(true) }}
          >
            + Add Supplier
          </Button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-white/40">Loading…</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            {suppliers.length === 0 ? (
              <div className="py-20 text-center text-white/40">No suppliers added yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.04] text-left text-xs uppercase tracking-wider text-white/40">
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
                      <tr key={s.id} className="border-b border-white/[0.06] transition hover:bg-white/[0.04]">
                        <td className="px-5 py-3 font-medium text-white">{s.name}</td>
                        <td className="px-5 py-3 text-white/70">{s.country}</td>
                        <td className="px-5 py-3">
                          {s.contact_email ? (
                            <a href={`mailto:${s.contact_email}`} className="text-sky-400 hover:underline">{s.contact_email}</a>
                          ) : "â€”"}
                        </td>
                        <td className="px-5 py-3">
                          {s.website ? (
                            <a href={s.website} target="_blank" rel="noreferrer" className="block max-w-[150px] truncate text-sky-400 hover:underline">
                              {s.website.replace(/^https?:\/\//, "")}
                            </a>
                          ) : "—"}
                        </td>
                        <td className="max-w-[200px] truncate px-5 py-3 text-white/50">{s.notes || "—"}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-3">
                            <button onClick={() => startEdit(s)} className="text-xs font-medium text-sky-400 transition hover:text-sky-300">Edit</button>
                            <button onClick={() => handleDelete(s.id)} className="text-xs font-medium text-red-400 transition hover:text-red-300">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <Modal
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(null) }}
          title={editing ? "Edit Supplier" : "Add Supplier"}
        >
          <div className="space-y-3 py-2">
            {(["name", "country", "email", "website"] as const).map(field => (
              <Input
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}
                name={field}
                type={field === "email" ? "email" : "text"}
                value={form[field] ?? ""}
                onChange={handleChange}
                required={field !== "website"}
                placeholder={field === "website" ? "https://example.com" : ""}
              />
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Notes</label>
              <textarea
                name="notes"
                rows={3}
                value={form.notes ?? ""}
                onChange={handleChange}
                placeholder="Specialties, certifications, terms…"
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/20"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => { setShowForm(false); setEditing(null) }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={saving}
                disabled={saving || !form.name || !form.email}
                onClick={handleSave}
              >
                {editing ? "Update" : "Add Supplier"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
