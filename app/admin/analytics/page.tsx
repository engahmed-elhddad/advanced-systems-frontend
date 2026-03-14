"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BarChart3, Search, FileText, TrendingUp, AlertCircle, Package } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
const ADMIN_KEY = "ADVANCED_SYSTEMS_ADMIN"

type AnalyticsData = {
  top_searched_parts: { part_number: string; count: number }[]
  no_result_searches: { query: string; created_at: string | null }[]
  trending_brands: { brand: string; count: number }[]
  most_requested_products: { part_number: string; count: number }[]
  high_demand_no_suppliers: { part_number: string; demand_score: number }[]
  search_trends: { date: string; count: number }[]
  rfq_trends: { date: string; count: number }[]
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetch(`${API}/admin/analytics?days=${days}`, {
      headers: { "api-key": ADMIN_KEY },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [days])

  const maxSearch = Math.max(...(data?.search_trends?.map((d) => d.count) || [1]), 1)
  const maxRfq = Math.max(...(data?.rfq_trends?.map((d) => d.count) || [1]), 1)
  const maxBrand = Math.max(...(data?.trending_brands?.map((d) => d.count) || [1]), 1)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Industrial Analytics</h1>
            <p className="text-gray-500 mt-1">Search & RFQ demand intelligence</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 skeleton h-48" />
            ))}
          </div>
        ) : !data ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
            Failed to load analytics. Ensure ADMIN_API_KEY is configured.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Search trends */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Search Trends
              </h2>
              <div className="flex items-end gap-1 h-32">
                {data.search_trends?.length ? (
                  data.search_trends.map((d) => (
                    <div
                      key={d.date}
                      className="flex-1 min-w-[8px] bg-primary-500 rounded-t transition-all hover:bg-primary-600"
                      style={{ height: `${(d.count / maxSearch) * 100}%` }}
                      title={`${d.date}: ${d.count}`}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No search data yet</p>
                )}
              </div>
              <div className="flex gap-1 mt-2 text-xs text-gray-500">
                {data.search_trends?.map((d) => (
                  <span key={d.date} className="flex-1 truncate" title={d.date}>
                    {d.date?.slice(5) || ""}
                  </span>
                ))}
              </div>
            </section>

            {/* RFQ trends */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                RFQ Trends
              </h2>
              <div className="flex items-end gap-1 h-32">
                {data.rfq_trends?.length ? (
                  data.rfq_trends.map((d) => (
                    <div
                      key={d.date}
                      className="flex-1 min-w-[8px] bg-violet-500 rounded-t transition-all hover:bg-violet-600"
                      style={{ height: `${(d.count / maxRfq) * 100}%` }}
                      title={`${d.date}: ${d.count}`}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No RFQ data yet</p>
                )}
              </div>
              <div className="flex gap-1 mt-2 text-xs text-gray-500">
                {data.rfq_trends?.map((d) => (
                  <span key={d.date} className="flex-1 truncate" title={d.date}>
                    {d.date?.slice(5) || ""}
                  </span>
                ))}
              </div>
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Top searched */}
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Top Searched Parts
                </h2>
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {data.top_searched_parts?.length ? (
                    data.top_searched_parts.map((p, i) => (
                      <li key={p.part_number} className="flex justify-between text-sm">
                        <Link href={`/part-number/${encodeURIComponent(p.part_number)}`} className="font-mono text-primary-600 hover:underline truncate">
                          {p.part_number}
                        </Link>
                        <span className="text-gray-500">{p.count}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 text-sm">No data</li>
                  )}
                </ul>
              </section>

              {/* Trending brands */}
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Trending Brands
                </h2>
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {data.trending_brands?.length ? (
                    data.trending_brands.map((b) => (
                      <li key={b.brand} className="flex items-center gap-2 text-sm">
                        <div
                          className="h-2 rounded bg-primary-500 shrink-0"
                          style={{ width: `${(b.count / maxBrand) * 120}px` }}
                        />
                        <span className="font-medium">{b.brand}</span>
                        <span className="text-gray-500">{b.count}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 text-sm">No data</li>
                  )}
                </ul>
              </section>

              {/* Most requested */}
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Most Requested Products (RFQ)
                </h2>
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {data.most_requested_products?.length ? (
                    data.most_requested_products.map((p) => (
                      <li key={p.part_number} className="flex justify-between text-sm">
                        <Link href={`/part-number/${encodeURIComponent(p.part_number)}`} className="font-mono text-primary-600 hover:underline truncate">
                          {p.part_number}
                        </Link>
                        <span className="text-gray-500">{p.count}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 text-sm">No data</li>
                  )}
                </ul>
              </section>

              {/* High demand, no suppliers */}
              <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  High Demand – No Suppliers
                </h2>
                <p className="text-sm text-gray-600 mb-3">Parts with RFQ/search demand but not in catalog.</p>
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {data.high_demand_no_suppliers?.length ? (
                    data.high_demand_no_suppliers.map((p) => (
                      <li key={p.part_number} className="flex justify-between text-sm">
                        <span className="font-mono text-amber-800 truncate">{p.part_number}</span>
                        <span className="text-amber-600 font-medium">{p.demand_score}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 text-sm">None identified</li>
                  )}
                </ul>
              </section>
            </div>

            {/* No-result searches */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                No-Result Searches
              </h2>
              <p className="text-sm text-gray-600 mb-3">Searches that returned zero results – opportunity for sourcing.</p>
              <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
                {data.no_result_searches?.length ? (
                  data.no_result_searches.map((s, i) => (
                    <li key={i} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                      <span className="font-mono truncate">{s.query}</span>
                      <span className="text-gray-400 text-xs">{s.created_at?.slice(0, 10)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">No data</li>
                )}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
