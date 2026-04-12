"use client"

import { apiFetch } from '@/lib/api'
import { getBrowserAdminApiKey } from "@/lib/admin-api-key"

import Link from "next/link"
import { useEffect, useState } from "react"
import { FolderTree, Play, Loader2, CheckCircle, XCircle, Clock, Zap } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

type Script = {
  id: string
  name: string
  description: string
  category: string
  last_run: string | null
  last_status: string | null
  rows_processed: number | null
}

export default function SystemToolsPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)
  const [result, setResult] = useState<{ script_id: string; data: Record<string, unknown> } | null>(null)
  const [partNumber, setPartNumber] = useState("")
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateResult, setGenerateResult] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const ADMIN_KEY = getBrowserAdminApiKey()
    if (!ADMIN_KEY) {
      setLoading(false)
      return
    }
    apiFetch(`${API}/admin/scripts`, { headers: { "api-key": ADMIN_KEY } })
      .then((res) => res.json())
      .then((data) => setScripts(data.scripts || []))
      .catch(() => setScripts([]))
      .finally(() => setLoading(false))
  }, [result])

  async function generateProduct() {
    if (!partNumber.trim()) return
    const ADMIN_KEY = getBrowserAdminApiKey()
    if (!ADMIN_KEY) {
      setGenerateResult({ error: "NEXT_PUBLIC_ADMIN_API_KEY is not set" })
      return
    }
    setGenerateLoading(true)
    setGenerateResult(null)
    try {
      const res = await apiFetch(`${API}/admin/intelligence/generate`, {
        method: "POST",
        headers: { "api-key": ADMIN_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ part_number: partNumber.trim() }),
      })
      const data = await res.json()
      setGenerateResult(data)
    } catch (e) {
      setGenerateResult({ error: e instanceof Error ? e.message : "Failed" })
    } finally {
      setGenerateLoading(false)
    }
  }

  async function runScript(scriptId: string, batchSize = 50, limit = 500) {
    const ADMIN_KEY = getBrowserAdminApiKey()
    if (!ADMIN_KEY) {
      setResult({ script_id: scriptId, data: { status: "error", message: "NEXT_PUBLIC_ADMIN_API_KEY is not set" } })
      return
    }
    setRunning(scriptId)
    setResult(null)
    try {
      const res = await apiFetch(
        `${API}/admin/run-script/${scriptId}?batch_size=${batchSize}&limit=${limit}`,
        { method: "POST", headers: { "api-key": ADMIN_KEY } }
      )
      const data = await res.json()
      setResult({ script_id: scriptId, data })
      if (!res.ok) throw new Error(data.detail || data.message || "Request failed")
    } catch (e) {
      setResult({ script_id: scriptId, data: { status: "error", message: e instanceof Error ? e.message : "Failed" } })
    } finally {
      setRunning(null)
    }
  }

  const categories = [...new Set(scripts.map((s) => s.category))]

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FolderTree className="w-8 h-8 text-primary-600" />
              System Tools — Scripts Manager
            </h1>
            <p className="text-gray-500 mt-1">
              Run product enrichment, image generation, datasheet fetch, and data quality scripts.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
          >
            ← Back to Admin
          </Link>
        </div>

        {/* Generate Product from Part Number */}
        <div className="mb-8 rounded-xl border border-primary-200 bg-primary-50/50 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-600" />
            Generate Product from Part Number
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Run full Product Intelligence: detect brand, category, series, find image, datasheet, AI enrichment.
          </p>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="e.g. 3RT1015-1BB41, 6ES7315-2AF03-0AB0"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateProduct()}
              className="px-4 py-2 rounded-lg border border-gray-200 w-64"
            />
            <button
              onClick={generateProduct}
              disabled={generateLoading || !partNumber.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium"
            >
              {generateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Generate
            </button>
          </div>
          {generateResult && (
            <pre className="mt-4 text-xs bg-white rounded border border-gray-200 p-4 overflow-x-auto max-h-48">
              {JSON.stringify(generateResult, null, 2)}
            </pre>
          )}
        </div>

        {result && (
          <div
            className={`mb-6 rounded-xl border p-4 ${
              result.data.status === "done"
                ? "border-primary-200 bg-primary-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {result.data.status === "done" ? (
                <CheckCircle className="w-5 h-5 text-primary-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span>
                {result.script_id}: {String(result.data?.status ?? "unknown")}
              </span>
            </div>
            <pre className="mt-2 text-sm overflow-x-auto text-gray-700">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl border border-gray-200 bg-white skeleton" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat) => (
              <div key={cat}>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">{cat}</h2>
                <div className="space-y-3">
                  {scripts
                    .filter((s) => s.category === cat)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">{s.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{s.description}</p>
                            {s.last_run && (
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Last run: {new Date(s.last_run).toLocaleString()}
                                {s.last_status && (
                                  <span
                                    className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                      s.last_status === "done"
                                        ? "bg-primary-100 text-primary-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {s.last_status}
                                  </span>
                                )}
                                {s.rows_processed != null && (
                                  <span className="ml-2 text-gray-500">
                                    {s.rows_processed} rows
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => runScript(s.id)}
                            disabled={running === s.id}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium transition-colors"
                          >
                            {running === s.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Running…
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                Run
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-sm text-gray-400">
          Scripts support batch processing (default batch_size=50, limit=500). Logs are written to{" "}
          <code className="bg-gray-100 px-1 rounded">logs/scripts.log</code> on the
          server.
        </p>
      </div>
    </div>
  )
}
