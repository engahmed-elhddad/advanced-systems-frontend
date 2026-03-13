"use client"

import { useState } from "react"

type CrawlResult = {
  part_number: string
  status: "found" | "not_found" | "error"
  source?: string
  image_url?: string
  uploaded_path?: string
  message?: string
}

export default function CrawlImagesPage() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CrawlResult[]>([])
  const [error, setError] = useState("")

  const handleCrawl = async () => {
    const parts = input
      .split(/[\n,]/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean)

    if (parts.length === 0) {
      setError("Please enter at least one part number.")
      return
    }

    setError("")
    setLoading(true)
    setResults([])

    try {
      const res = await fetch("/api/crawl-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part_numbers: parts }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults(data.results ?? [])
      } else {
        setError(data.error || "Request failed")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  const found = results.filter((r) => r.status === "found").length
  const notFound = results.filter((r) => r.status === "not_found").length
  const errors = results.filter((r) => r.status === "error").length

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-3xl font-bold text-slate-900 mb-2"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Image Crawler
        </h1>
        <p className="text-slate-500 mb-8 text-sm">
          Enter part numbers to search distributor sites for product images and upload them automatically.
          Sources tried in order:{" "}
          <a
            href="https://uk.rs-online.com"
            target="_blank"
            rel="noreferrer"
            className="text-teal-600 underline"
          >
            RS Components
          </a>
          {" → "}
          <a
            href="https://www.radwell.com"
            target="_blank"
            rel="noreferrer"
            className="text-teal-600 underline"
          >
            Radwell
          </a>
          {" → "}
          <a
            href="https://www.mouser.com"
            target="_blank"
            rel="noreferrer"
            className="text-teal-600 underline"
          >
            Mouser
          </a>
          {" → "}
          <a
            href="https://www.electech.com.eg"
            target="_blank"
            rel="noreferrer"
            className="text-teal-600 underline"
          >
            Electech
          </a>
          .
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Part Numbers <span className="text-slate-400 font-normal">(one per line or comma-separated)</span>
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"E5CC-RX2ASM-800\nCPU 1214C\nCP1H-X40DR-A"}
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm font-mono resize-none"
          />
          {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
          <button
            type="button"
            onClick={handleCrawl}
            disabled={loading}
            className="mt-4 w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold transition"
          >
            {loading ? "Crawling…" : "Crawl Images"}
          </button>
        </div>

        {results.length > 0 && (
          <div>
            <div className="flex gap-4 mb-4 text-sm">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                ✓ {found} found
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                ~ {notFound} not found
              </span>
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                ✗ {errors} errors
              </span>
            </div>

            <div className="space-y-3">
              {results.map((r) => (
                <div
                  key={r.part_number}
                  className={`rounded-xl border p-4 flex items-start gap-4 ${
                    r.status === "found"
                      ? "border-emerald-200 bg-emerald-50"
                      : r.status === "not_found"
                      ? "border-amber-200 bg-amber-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  {r.status === "found" && r.uploaded_path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"}${r.uploaded_path}`}
                      alt={r.part_number}
                      className="h-16 w-16 object-contain rounded-lg border border-slate-200 bg-white shrink-0"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = "none"
                      }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 font-mono">{r.part_number}</div>
                    {r.status === "found" && (
                      <div className="text-sm text-emerald-700 mt-0.5">
                        Image uploaded →{" "}
                        <span className="font-mono">{r.uploaded_path}</span>
                        {r.source && (
                          <span className="ml-2 text-emerald-600 font-normal">
                            (via {r.source})
                          </span>
                        )}
                      </div>
                    )}
                    {r.status === "not_found" && (
                      <div className="text-sm text-amber-700 mt-0.5">
                        {r.message || "No image found on electech.com.eg"}
                      </div>
                    )}
                    {r.status === "error" && (
                      <div className="text-sm text-red-700 mt-0.5">{r.message}</div>
                    )}
                    {r.image_url && (
                      <a
                        href={r.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-teal-600 underline mt-1 block truncate"
                      >
                        {r.image_url}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
