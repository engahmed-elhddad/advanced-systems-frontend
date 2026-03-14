"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getAuthHeaders } from "@/lib/admin-auth"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

type Param = { key: string; value: string | null; default_value: string; description: string | null; category: string | null }

export default function AdminSystemPage() {
  const [params, setParams] = useState<Param[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API}/admin/system/parameters`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        setParams(d.items ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(key: string, value: string) {
    setSaving(true)
    try {
      const res = await fetch(`${API}/admin/system/parameters/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ value }),
      })
      if (res.ok) {
        setParams((prev) => prev.map((p) => (p.key === key ? { ...p, value } : p)))
        setEditing((e) => { const next = { ...e }; delete next[key]; return next; })
      }
    } catch {
      alert("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const byCategory = params.reduce<Record<string, Param[]>>((acc, p) => {
    const cat = p.category || "General"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Parameters</h1>
          <p className="text-gray-500 text-sm">Configure search, SEO, crawler, RFQ. Falls back to defaults if empty.</p>
        </div>
        <Link href="/admin" className="text-sm text-primary-600 hover:underline">← Dashboard</Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 font-medium text-gray-700 text-sm">
                {category}
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((p) => (
                  <div key={p.key} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-900">{p.key}</p>
                        {p.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                        )}
                      </div>
                      <div className="flex-1 max-w-xs">
                        {editing[p.key] !== undefined ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editing[p.key]}
                              onChange={(e) => setEditing((x) => ({ ...x, [p.key]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 rounded border border-gray-200 text-sm"
                            />
                            <button
                              onClick={() => handleSave(p.key, editing[p.key])}
                              disabled={saving}
                              className="px-3 py-1.5 rounded bg-primary-500 text-white text-sm disabled:opacity-70"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditing((x) => { const next = { ...x }; delete next[p.key]; return next; })}
                              className="px-3 py-1.5 rounded border border-gray-200 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700 truncate">{p.value ?? p.default_value}</span>
                            <button
                              onClick={() => setEditing((x) => ({ ...x, [p.key]: p.value ?? p.default_value }))}
                              className="text-primary-600 text-xs font-medium hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                        {p.default_value && (
                          <p className="text-xs text-gray-400 mt-0.5">Default: {p.default_value}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
