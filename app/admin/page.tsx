"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"
const ADMIN_KEY = "ADVANCED_SYSTEMS_ADMIN"

const adminLinks = [
  { href: "/admin/add-product", label: "➕ Add Product", color: "hover:border-emerald-400 hover:text-emerald-700" },
  { href: "/admin/import", label: "📥 Import CSV", color: "hover:border-sky-400 hover:text-sky-700" },
  { href: "/admin/bulk-import", label: "📦 Bulk Import", color: "hover:border-sky-400 hover:text-sky-700" },
  { href: "/admin/upload-images", label: "🖼️ Upload Images", color: "hover:border-violet-400 hover:text-violet-700" },
  { href: "/admin/crawl-images", label: "🔍 Crawl Images", color: "hover:border-violet-400 hover:text-violet-700" },
  { href: "/admin/enrich", label: "✨ Enrich Products", color: "hover:border-amber-400 hover:text-amber-700" },
  { href: "/admin/intelligence", label: "🧠 Part Intelligence", color: "hover:border-amber-400 hover:text-amber-700" },
  { href: "/admin/stock", label: "📊 Stock Dashboard", color: "hover:border-teal-400 hover:text-teal-700" },
  { href: "/admin/rfq", label: "📋 RFQ Management", color: "hover:border-rose-400 hover:text-rose-700" },
  { href: "/admin/suppliers", label: "🏭 Suppliers", color: "hover:border-orange-400 hover:text-orange-700" },
  { href: "/admin/ai", label: "🤖 AI Assistant", color: "hover:border-indigo-400 hover:text-indigo-700" },
]

type Stats = {
  total_products: number
  total_rfqs: number
  pending_rfqs: number
  total_suppliers: number
  total_brands: number
  total_categories: number
}

type RecentRFQ = {
  id: number
  part_number: string
  email: string
  status: string
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-sky-100 text-sky-700",
  responded: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentRFQs, setRecentRFQs] = useState<RecentRFQ[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/admin/dashboard`, {
      headers: { "api-key": ADMIN_KEY },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats ?? null)
        setRecentRFQs(data.recent_rfqs ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: "Products", value: stats.total_products, icon: "📦", color: "text-sky-600" },
    { label: "RFQs", value: stats.total_rfqs, icon: "📋", color: "text-violet-600" },
    { label: "Pending RFQs", value: stats.pending_rfqs, icon: "⏳", color: "text-amber-600" },
    { label: "Suppliers", value: stats.total_suppliers, icon: "🏭", color: "text-emerald-600" },
    { label: "Brands", value: stats.total_brands, icon: "🏷️", color: "text-rose-600" },
    { label: "Categories", value: stats.total_categories, icon: "🗂️", color: "text-orange-600" },
  ] : []

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm">Advanced Systems – Management Panel</p>
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition">← Back to Site</Link>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
                <div className="h-6 w-10 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-16 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{s.icon} {s.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition shadow-sm ${link.color}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Recent RFQs */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Recent RFQs</h2>
            <Link href="/admin/rfq" className="text-sm text-sky-600 hover:text-sky-700 font-medium transition">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Part Number</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRFQs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      {loading ? "Loading…" : "No RFQs yet."}
                    </td>
                  </tr>
                )}
                {recentRFQs.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-6 py-3 text-slate-500">#{r.id}</td>
                    <td className="px-6 py-3 font-mono text-sky-700">{r.part_number}</td>
                    <td className="px-6 py-3 text-slate-600">{r.email}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}