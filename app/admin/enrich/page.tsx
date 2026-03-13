"use client"

import { useState } from "react"

type EnrichResult = {
  total: number
  enriched: number
  failed: number
}

export default function EnrichProductsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EnrichResult | null>(null)
  const [error, setError] = useState("")

  const handleEnrich = async () => {
    setLoading(true)
    setResult(null)
    setError("")

    try {
      const res = await fetch("/api/enrich-products", {
        method: "POST",
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error")
        setError(`Backend error (${res.status}): ${text}`)
        return
      }

      const data = await res.json()
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1
          className="text-3xl font-bold text-slate-900 mb-2"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Database Enrichment
        </h1>
        <p className="text-slate-500 mb-8 text-sm">
          Scans all products with missing fields and automatically fills{" "}
          <strong>category</strong>, <strong>description</strong>,{" "}
          <strong>datasheet</strong>, and <strong>manufacturer</strong> using
          distributor lookups and part-number pattern analysis.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-base font-semibold text-slate-800 mb-3">
            How it works
          </h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-600">
            <li>
              <strong>Local analysis</strong> – infers manufacturer &amp; category
              from well-known part-number prefixes (e.g. <code>6ES→</code>
              Siemens PLC, <code>ACS→</code> ABB Drives).
            </li>
            <li>
              <strong>RS Components</strong> – fetches description from product
              page.
            </li>
            <li>
              <strong>Mouser</strong> – fallback description source.
            </li>
            <li>
              <strong>Alldatasheet / Mouser / RS</strong> – looks up a datasheet
              PDF link.
            </li>
            <li>
              <strong>Default description</strong> – generated from part number,
              category and manufacturer when online sources return nothing.
            </li>
          </ol>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="font-semibold text-emerald-800 mb-1">
                Enrichment complete
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-slate-600">
                  <strong className="text-slate-900">{result.total}</strong> products scanned
                </span>
                <span className="text-emerald-700">
                  <strong>{result.enriched}</strong> updated
                </span>
                {result.failed > 0 && (
                  <span className="text-red-700">
                    <strong>{result.failed}</strong> failed
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleEnrich}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enriching products…
              </span>
            ) : (
              "Run Database Enrichment"
            )}
          </button>

          <p className="mt-3 text-xs text-slate-400 text-center">
            This may take several minutes for large product catalogues. The
            operation runs as a background task on the server.
          </p>
        </div>
      </div>
    </div>
  )
}
