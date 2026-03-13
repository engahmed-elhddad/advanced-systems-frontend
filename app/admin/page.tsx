"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Package, FileText, Image, Users, Tag, FolderTree, BarChart3, Zap } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
const ADMIN_KEY = "ADVANCED_SYSTEMS_ADMIN"

const adminSections = [
  {
    title: "Product Manager",
    icon: Package,
    links: [
      { href: "/admin/add-product", label: "Add Product", desc: "Create a new product" },
      { href: "/admin/import", label: "Import CSV", desc: "Bulk import from CSV" },
      { href: "/admin/bulk-import", label: "Bulk Import", desc: "Bulk data import" },
    ],
  },
  {
    title: "Image Manager",
    icon: Image,
    links: [
      { href: "/admin/image-manager", label: "Product Image Manager", desc: "Upload, replace, delete, set primary" },
      { href: "/admin/upload-images", label: "Upload Images", desc: "Legacy upload" },
      { href: "/admin/crawl-images", label: "Crawl Images", desc: "Fetch from distributors" },
    ],
  },
  {
    title: "Data Enrichment",
    icon: Zap,
    links: [
      { href: "/admin/enrich", label: "Enrich Products", desc: "Auto-fill missing data" },
      { href: "/admin/intelligence", label: "Part Intelligence", desc: "Analyze part numbers" },
    ],
  },
  {
    title: "RFQ Manager",
    icon: FileText,
    links: [
      { href: "/admin/rfq", label: "RFQ Management", desc: "View and respond to RFQs" },
    ],
  },
  {
    title: "Brands & Categories",
    icon: Tag,
    links: [
      { href: "/admin/suppliers", label: "Suppliers", desc: "Manage supplier list" },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    links: [
      { href: "/admin/stock", label: "Stock Dashboard", desc: "Inventory overview" },
      { href: "/admin/ai", label: "AI Assistant", desc: "AI tools" },
      { href: "/admin/dev", label: "Dev Tools", desc: "Developer utilities" },
    ],
  },
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
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-sky-100 text-sky-700 border-sky-200",
  responded: "bg-industrial-green-100 text-industrial-green-700 border-industrial-green-200",
  closed: "bg-industrial-gray-100 text-industrial-gray-600 border-industrial-gray-200",
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
      .catch(() => ({}))
      .then((data) => {
        setStats(data.stats ?? null)
        setRecentRFQs(data.recent_rfqs ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats
    ? [
        { label: "Products", value: stats.total_products, color: "text-industrial-green-600", bg: "bg-industrial-green-50" },
        { label: "RFQs", value: stats.total_rfqs, color: "text-violet-600", bg: "bg-violet-50" },
        { label: "Pending", value: stats.pending_rfqs, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Suppliers", value: stats.total_suppliers, color: "text-sky-600", bg: "bg-sky-50" },
        { label: "Brands", value: stats.total_brands, color: "text-rose-600", bg: "bg-rose-50" },
        { label: "Categories", value: stats.total_categories, color: "text-orange-600", bg: "bg-orange-50" },
      ]
    : []

  return (
    <div className="min-h-screen bg-industrial-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-industrial-gray-900">Admin Dashboard</h1>
            <p className="text-industrial-gray-500 mt-1">Advanced Systems — Industrial Automation Marketplace</p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-industrial-gray-500 hover:text-industrial-green-600 transition-colors"
          >
            ← Back to Site
          </Link>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-industrial-gray-200 bg-white p-5 skeleton" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-industrial-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
                <div className="text-xs text-industrial-gray-500 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Sections */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {adminSections.map((section) => {
            const Icon = section.icon
            return (
              <div
                key={section.title}
                className="rounded-xl border border-industrial-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-industrial-green-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-industrial-green-600" />
                  </div>
                  <h2 className="font-semibold text-industrial-gray-900">{section.title}</h2>
                </div>
                <ul className="space-y-1">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 hover:text-industrial-green-700 transition-colors"
                      >
                        <span className="font-medium">{link.label}</span>
                        <span className="text-industrial-gray-400 ml-2">— {link.desc}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Recent RFQs */}
        <div className="rounded-xl border border-industrial-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-industrial-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-industrial-gray-900">Recent RFQs</h2>
            <Link
              href="/admin/rfq"
              className="text-sm font-medium text-industrial-green-600 hover:text-industrial-green-700 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-industrial-gray-500 text-xs uppercase tracking-wider border-b border-industrial-gray-100">
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
                    <td colSpan={5} className="px-6 py-8 text-center text-industrial-gray-400">
                      {loading ? "Loading…" : "No RFQs yet."}
                    </td>
                  </tr>
                )}
                {recentRFQs.map((r) => (
                  <tr key={r.id} className="border-b border-industrial-gray-50 hover:bg-industrial-gray-50/50 transition">
                    <td className="px-6 py-3 text-industrial-gray-500">#{r.id}</td>
                    <td className="px-6 py-3 font-mono text-industrial-green-700">{r.part_number}</td>
                    <td className="px-6 py-3 text-industrial-gray-600">{r.email}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[r.status] ?? "bg-industrial-gray-100 text-industrial-gray-600 border-industrial-gray-200"}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-industrial-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
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
