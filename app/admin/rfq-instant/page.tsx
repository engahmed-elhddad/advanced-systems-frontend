"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "ADVANCED_SYSTEMS_ADMIN"

type InstantRFQ = {
  id: number
  reference: string
  part_number: string
  quantity: number
  email: string
  status: string
  created_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  in_progress: "bg-sky-500/15 text-sky-400",
  responded: "bg-emerald-500/15 text-emerald-400",
  closed: "bg-slate-500/15 text-slate-400",
}

export default function AdminInstantRFQPage() {
  const [items, setItems] = useState<InstantRFQ[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    fetch(`${API}/api/rfq/instant/list?page=${page}&limit=50`, {
      headers: { "api-key": ADMIN_KEY },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load")
        return r.json()
      })
      .then((d) => {
        setItems(d.items ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => setError("Could not load Instant RFQs. Check API and api-key."))
      .finally(() => setLoading(false))
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / 50))

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin" className="text-slate-500 hover:text-slate-700 text-sm">← Admin</Link>
              <Link href="/admin/rfq" className="text-sky-600 hover:underline text-sm">Full RFQ</Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Instant RFQ Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Quote requests submitted via the quick 3-field form</p>
          </div>
          <span className="text-sm text-slate-500">{total} total</span>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 mb-6">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            No Instant RFQ submissions yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Part #</th>
                    <th className="px-5 py-3">Qty</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-mono text-slate-700">{r.reference}</td>
                      <td className="px-5 py-3 font-mono font-semibold text-slate-800">{r.part_number}</td>
                      <td className="px-5 py-3 text-slate-600">{r.quantity}</td>
                      <td className="px-5 py-3">
                        <a href={`mailto:${r.email}`} className="text-sky-600 hover:underline">{r.email}</a>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-500"}`}>
                          {(r.status || "pending").replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <a href={`mailto:${r.email}?subject=Re: Quote for ${r.part_number} (${r.reference})`} className="text-xs font-medium text-sky-600 hover:text-sky-800 transition">
                          Email customer
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
