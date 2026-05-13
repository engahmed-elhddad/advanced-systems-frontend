"use client"

import { apiFetch } from '@/lib/api'
import { getAuthHeaders } from "@/lib/admin-auth"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Database,
  RefreshCw,
  FileSearch,
  Clock,
  Zap,
  AlertCircle,
  ChevronRight,
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

type EngineStatus = {
  last_run?: string
  last_job?: string
  last_status?: Record<string, unknown>
  history?: Array<{
    timestamp: string
    job: string
    discovered?: number
    inserted?: number
    updated?: number
    enriched?: number
    skipped?: number
    errors?: string[]
  }>
}

type LogEntry = {
  timestamp: string
  job: string
  event: string
  part_number?: string
  status?: string
  message?: string
  meta?: Record<string, unknown>
}

const JOBS = [
  { id: "daily_discovery", label: "Daily Discovery", desc: "Crawl sources, insert new products, enrich", icon: Database },
  { id: "weekly_updates", label: "Weekly Updates", desc: "Re-enrich products with missing data", icon: RefreshCw },
  { id: "datasheet_refresh", label: "Datasheet Refresh", desc: "Find datasheets for products missing them", icon: FileSearch },
]

export default function DataEnginePage() {
  const [status, setStatus] = useState<EngineStatus | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)

  const fetchData = () => {
    const headers = getAuthHeaders()
    Promise.all([
      apiFetch(`${API}/admin/data-engine/status`, { headers })
        .then((r) => r.json())
        .catch(() => ({})),
      apiFetch(`${API}/admin/data-engine/logs?limit=80`, { headers })
        .then((r) => r.json())
        .then((d) => d.logs || [])
        .catch(() => []),
    ]).then(([s, l]) => {
      setStatus(s)
      setLogs(l)
    })
    .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const runJob = async (jobId: string) => {
    setRunning(jobId)
    try {
      const res = await apiFetch(`${API}/admin/data-engine/run/${jobId}`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      fetchData()
      return data
    } finally {
      setRunning(null)
    }
  }

  const last = status?.last_status
  const history = status?.history || []

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Engine</h1>
            <p className="text-gray-500 mt-1">
              Autonomous discovery &amp; enrichment – catalog grows automatically
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
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
            <div className="rounded-xl border border-gray-200 bg-white p-8 skeleton h-48" />
            <div className="rounded-xl border border-gray-200 bg-white p-8 skeleton h-64" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Jobs */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Run Job
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {JOBS.map((j) => {
                  const Icon = j.icon
                  const isRunning = running === j.id
                  return (
                    <button
                      key={j.id}
                      onClick={() => runJob(j.id)}
                      disabled={isRunning}
                      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors text-left disabled:opacity-60"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{j.label}</div>
                        <div className="text-xs text-gray-500 truncate">{j.desc}</div>
                      </div>
                      {isRunning ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-primary-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Last run */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Last Run
              </h2>
              {status?.last_run ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Job:</span>
                    <span className="font-mono font-medium">{status.last_job || "—"}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">
                      {new Date(status.last_run).toLocaleString()}
                    </span>
                  </div>
                  {last && (
                    <div className="mt-3 p-3 rounded-lg bg-gray-50 font-mono text-sm">
                      {Object.entries(last).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-gray-500">{k}:</span>
                          <span>
                            {Array.isArray(v)
                              ? v.length > 3
                                ? `${v.length} items`
                                : JSON.stringify(v)
                              : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No runs yet. Trigger a job above.</p>
              )}
            </section>

            {/* History */}
            {history.length > 0 && (
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Run History</h2>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {history.slice(-10).reverse().map((h, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm"
                    >
                      <span className="font-mono text-gray-700">{h.job}</span>
                      <span className="text-gray-500">
                        {h.inserted !== undefined && `${h.inserted} inserted`}
                        {h.updated !== undefined && `${h.updated} updated`}
                        {h.discovered !== undefined && `${h.discovered} discovered`}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(h.timestamp).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Pipeline logs */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Pipeline Logs
              </h2>
              <ul className="space-y-1 max-h-72 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <li className="text-gray-400 py-4">No log entries yet</li>
                ) : (
                  logs.slice(-60).reverse().map((log, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 py-1 text-gray-600 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-gray-400 shrink-0 w-20 truncate">
                        {log.timestamp?.slice(0, 19).replace("T", " ")}
                      </span>
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded ${
                          log.event === "complete"
                            ? "bg-green-100 text-green-700"
                            : log.event === "inserted"
                            ? "bg-primary-100 text-primary-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {log.job}/{log.event}
                      </span>
                      {log.part_number && (
                        <span className="text-primary-600 truncate">{log.part_number}</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
