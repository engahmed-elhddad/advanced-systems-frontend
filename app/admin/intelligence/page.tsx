"use client"

import { useState } from "react"

interface IntelligenceResult {
  brand: string | null
  series: string | null
  category: string | null
  normalized: string
  matched_prefix: string | null
  confidence: "high" | "low" | "none"
}

export default function IntelligencePage() {
  const [input, setInput] = useState("")
  const [result, setResult] = useState<IntelligenceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDetect() {
    const trimmed = input.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(
        `/api/intelligence/${encodeURIComponent(trimmed)}`
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Unknown error")
      } else {
        setResult(data)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleDetect()
  }

  const matched = result && result.confidence !== "none"

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1
          className="text-3xl font-bold text-slate-900 mb-1"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Part Number Intelligence Engine
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          Automatically detect brand, series, and category from industrial part
          numbers.
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 6ES7315-2EH14-0AB0"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            onClick={handleDetect}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {loading ? "Detecting…" : "Detect"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`rounded-2xl border shadow-sm overflow-hidden ${
              matched
                ? "border-teal-200 bg-white"
                : "border-slate-200 bg-white"
            }`}
          >
            {/* Header */}
            <div
              className={`px-6 py-4 border-b ${
                matched
                  ? "bg-teal-50 border-teal-100"
                  : "bg-slate-50 border-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    matched
                      ? "bg-teal-100 text-teal-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {matched ? "✓ Pattern Matched" : "✗ No Match"}
                </span>
                <span className="font-mono text-sm text-slate-500">
                  {result.normalized}
                </span>
              </div>
            </div>

            {/* Fields */}
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <Field
                label="Brand"
                value={result.brand}
                highlight={matched ?? false}
              />
              <Field
                label="Series"
                value={result.series}
                highlight={matched ?? false}
              />
              <Field
                label="Category"
                value={result.category}
                highlight={matched ?? false}
              />
              <Field
                label="Matched Prefix"
                value={result.matched_prefix}
                mono
              />
              <Field
                label="Confidence"
                value={result.confidence}
              />
              <Field
                label="Normalized"
                value={result.normalized}
                mono
              />
            </div>

            {!matched && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-sm text-slate-500">
                No industrial pattern recognized. AI product generation will be
                used as fallback.
              </div>
            )}
          </div>
        )}

        {/* Examples */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
            Example Part Numbers
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.part}
                onClick={() => setInput(ex.part)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm hover:border-teal-300 hover:bg-teal-50 transition"
              >
                <div className="font-mono text-sm font-medium text-teal-700">
                  {ex.part}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {ex.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string
  value: string | null
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd
        className={`text-sm ${mono ? "font-mono" : "font-medium"} ${
          value && highlight
            ? "text-teal-700"
            : value
            ? "text-slate-800"
            : "text-slate-300 italic"
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  )
}

const EXAMPLES = [
  { part: "6ES7315-2EH14-0AB0", label: "Siemens S7-300 PLC CPU" },
  { part: "6GK7443-1EX11-0XE0", label: "Siemens SIMATIC NET" },
  { part: "3RT2028-1AP00", label: "Siemens SIRIUS Contactor" },
  { part: "LC1D25U7", label: "Schneider TeSys D Contactor" },
  { part: "ATV71HU15N4", label: "Schneider Altivar 71 Drive" },
  { part: "ACS550-01-015A-4", label: "ABB ACS550 Drive" },
  { part: "E2E-X10MF1", label: "Omron Proximity Sensor" },
  { part: "CJ2M-CPU11", label: "Omron CJ2 PLC CPU" },
  { part: "FX5U-32MT/ES", label: "Mitsubishi FX5U PLC" },
  { part: "PNOZ-X3", label: "Pilz Safety Relay" },
]
