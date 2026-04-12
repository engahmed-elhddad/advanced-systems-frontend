"use client"

import { apiFetch } from '@/lib/api'

import { useState, useEffect } from "react"
import Link from "next/link"
import { getAuthHeaders } from "@/lib/admin-auth"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

interface Category {
  id: number
  name: string
  slug: string
  path: string
  depth: number
  is_active: boolean
  sort_order: number
}

export default function CategorySchemasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch(`${API}/api/v1/categories?limit=200`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => {
        const items = d.items ?? d.categories ?? d ?? []
        setCategories(Array.isArray(items) ? items : [])
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-slate-400 hover:text-slate-600 text-sm">← Dashboard</Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-2xl font-bold text-slate-900">Category Schemas</h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-sm text-slate-500">Click a category to manage its attribute schema.</p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading…</div>
          ) : categories.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No categories found.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link
                    href={`/admin/categories/${cat.id}/schema`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {cat.depth > 0 && (
                          <span className="text-slate-300 text-sm">{"└".padStart(cat.depth * 2 + 1, "·")}</span>
                        )}
                        <span className="font-medium text-slate-900 group-hover:text-sky-700 transition-colors">{cat.name}</span>
                        {!cat.is_active && (
                          <span className="text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">inactive</span>
                        )}
                      </div>
                      {cat.path && (
                        <p className="text-xs text-slate-400 font-mono mt-0.5 ml-0">{cat.path}</p>
                      )}
                    </div>
                    <span className="text-slate-300 group-hover:text-sky-500 transition-colors text-sm">Edit Schema →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
