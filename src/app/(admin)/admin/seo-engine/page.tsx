"use client"

import { apiFetch } from '@/lib/api'

import Link from "next/link"
import { useEffect, useState } from "react"
import { FileText, Zap, RefreshCw, Layers } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
const ADMIN_KEY = "ADVANCED_SYSTEMS_ADMIN"

type Pattern = { series: string; brand: string; suffixes?: string[]; numeric_range?: number[] }

export default function SeoEnginePage() {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ created?: number; skipped?: number; message?: string; errors?: string[] } | null>(null)

  useEffect(() => {
    apiFetch(`${API}/admin/seo-engine/patterns`, {
      headers: { "api-key": ADMIN_KEY },
    })
      .then((r) => r.json())
      .then((d) => setPatterns(d.patterns || []))
      .catch(() => setPatterns([]))
      .finally(() => setLoading(false))
  }, [])

  const runGenerate = (series?: string, limit = 50) => {
    setGenerating(true)
    setResult(null)
    const params = new URLSearchParams()
    if (series) params.set("series", series)
    params.set("limit_per_series", String(limit))
    apiFetch(`${API}/admin/seo-engine/generate?${params}`, {
      method: "POST",
      headers: { "api-key": ADMIN_KEY },
    })
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult({ errors: ["Request failed"] }))
      .finally(() => setGenerating(false))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mass Part Number SEO Engine</h1>
            <p className="text-gray-500 mt-1">
              Generate thousands of industrial product pages from series patterns
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Quick generate */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Generate Product Pages
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Generates product pages with brand, category, datasheet link, and RFQ option. Uses Product Intelligence for enrichment.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => runGenerate(undefined, 30)}
              disabled={generating}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {generating ? "Generating…" : "Generate All Series (30/pattern)"}
            </button>
            <button
              onClick={() => runGenerate("LC1D,3RT10,E2E", 20)}
              disabled={generating}
              className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
            >
              Generate LC1D, 3RT10, E2E
            </button>
          </div>
          {result && (
            <div className="mt-4 p-4 rounded-lg bg-gray-50 font-mono text-sm">
              <p className="text-green-700">{result.message}</p>
              {result.created !== undefined && <p>Created: {result.created}</p>}
              {result.skipped !== undefined && <p>Skipped (existing): {result.skipped}</p>}
              {result.errors?.length ? (
                <p className="text-amber-600 mt-2">Errors: {result.errors.slice(0, 5).join(", ")}</p>
              ) : null}
            </div>
          )}
        </section>

        {/* Patterns */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Series Patterns
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            3RT10 → Siemens contactors • LC1D → Schneider contactors • E2E → Omron proximity sensors
          </p>
          {loading ? (
            <div className="h-48 skeleton rounded-lg" />
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {patterns.map((p, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-gray-100 hover:border-primary-200 flex justify-between items-center"
                >
                  <div>
                    <span className="font-mono font-medium">{p.series}</span>
                    <span className="text-gray-500 text-sm ml-2">{p.brand}</span>
                  </div>
                  <button
                    onClick={() => runGenerate(p.series, 15)}
                    disabled={generating}
                    className="text-xs px-2 py-1 rounded bg-primary-100 text-primary-700 hover:bg-primary-200"
                  >
                    Generate
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-sm text-gray-500 mt-6">
          Sitemap updates automatically (revalidates every hour). Run &quot;SEO Mass Enrich&quot; from System Tools to enrich with images and specs.
        </p>
      </div>
    </div>
  )
}
