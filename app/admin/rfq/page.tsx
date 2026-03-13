"use client"

import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

type RFQ = {
  id: number
  part_number: string
  quantity: number
  company?: string
  email: string
  country?: string
  message?: string
  status: string
  created_at: string
  response_price?: string
  response_lead_time?: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  in_progress: "bg-sky-500/15 text-sky-400",
  responded: "bg-emerald-500/15 text-emerald-400",
  closed: "bg-slate-500/15 text-slate-400",
}

export default function AdminRFQPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<RFQ | null>(null)
  const [response, setResponse] = useState({ price: "", lead_time: "", status: "responded" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API}/admin/rfq`, { headers: { "api-key": "ADVANCED_SYSTEMS_ADMIN" } })
      .then(r => r.json())
      .then(d => setRfqs(d.rfqs ?? d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleRespond(rfqId: number) {
    setSaving(true)
    try {
      await fetch(`${API}/admin/rfq/${rfqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "api-key": "ADVANCED_SYSTEMS_ADMIN" },
        body: JSON.stringify({
          status: response.status,
          response_price: response.price,
          response_lead_time: response.lead_time,
        }),
      })
      setRfqs(prev => prev.map(r => r.id === rfqId ? { ...r, status: response.status, response_price: response.price, response_lead_time: response.lead_time } : r))
      setSelected(null)
    } catch {
      alert("Failed to update RFQ")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">RFQ Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">View and respond to Request For Quote submissions</p>
          </div>
          <span className="text-sm text-slate-500">{rfqs.length} total requests</span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading…</div>
        ) : rfqs.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No RFQ submissions yet.</div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3">Part #</th>
                    <th className="px-5 py-3">Qty</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Country</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqs.map(rfq => (
                    <tr key={rfq.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-mono font-semibold text-slate-800">{rfq.part_number}</td>
                      <td className="px-5 py-3 text-slate-600">{rfq.quantity}</td>
                      <td className="px-5 py-3 text-slate-600">{rfq.company || "—"}</td>
                      <td className="px-5 py-3">
                        <a href={`mailto:${rfq.email}`} className="text-sky-600 hover:underline">{rfq.email}</a>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{rfq.country || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[rfq.status] ?? "bg-slate-100 text-slate-500"}`}>
                          {rfq.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(rfq.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => { setSelected(rfq); setResponse({ price: rfq.response_price ?? "", lead_time: rfq.response_lead_time ?? "", status: "responded" }) }}
                          className="text-xs font-medium text-sky-600 hover:text-sky-800 transition"
                        >
                          Respond
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Response modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Respond to RFQ</h2>
              <p className="text-sm text-slate-500 mb-5">
                Part: <span className="font-mono font-semibold text-slate-800">{selected.part_number}</span>{" "}
                · Qty: {selected.quantity}
              </p>
              {selected.message && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-600 mb-4">
                  <strong>Customer note:</strong> {selected.message}
                </div>
              )}
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Price / Unit</label>
                  <input
                    type="text"
                    value={response.price}
                    onChange={e => setResponse(p => ({ ...p, price: e.target.value }))}
                    placeholder="e.g. $125 USD"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Lead Time</label>
                  <input
                    type="text"
                    value={response.lead_time}
                    onChange={e => setResponse(p => ({ ...p, lead_time: e.target.value }))}
                    placeholder="e.g. 3–5 business days"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select
                    value={response.status}
                    onChange={e => setResponse(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="responded">Responded</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition">Cancel</button>
                <button
                  onClick={() => handleRespond(selected.id)}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold disabled:opacity-60 transition"
                >
                  {saving ? "Saving…" : "Save Response"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
