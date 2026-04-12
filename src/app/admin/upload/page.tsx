"use client"

import { useState } from "react"
import { uploadProductsCsv } from "@/lib/admin-api"
import { FileUp, ShieldAlert, CircleCheck, CircleX, Rows3 } from "lucide-react"
import { Button, Card } from "@/components/ui"

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [strict, setStrict] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await uploadProductsCsv(file, strict)
      if (!res.ok) {
        setError(res?.data?.message || res?.data?.detail || "Upload failed")
        return
      }
      setResult(res.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Upload CSV</h1>
        <p className="mt-1 text-sm text-white/55">Import products with validation and per-row errors.</p>
      </div>

      <Card hover={false} className="p-0" padding="none">
        <div className="space-y-4 p-5">
          <input
            type="file"
            accept=".csv,.json"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-orange-100"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/75">
            <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} className="rounded border-white/25" />
            <ShieldAlert className="h-4 w-4 text-amber-300" />
            Strict mode (reject unknown fields)
          </label>
          <div>
            <Button
              disabled={!file || loading}
              onClick={handleUpload}
              variant="primary"
              leftIcon={<FileUp className="h-4 w-4" />}
            >
              {loading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100 backdrop-blur-xl">{error}</div>
      ) : null}

      {result ? (
        <Card hover={false} className="p-0" padding="none">
          <div className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <Rows3 className="h-4 w-4 text-orange-300" />
              Import Result
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.07]">
                <p className="flex items-center gap-1.5 text-xs text-white/50">
                  <CircleCheck className="h-4 w-4 text-emerald-300" />
                  Success
                </p>
                <p className="mt-2 text-xl font-semibold text-emerald-200">{result.success_count ?? 0}</p>
              </div>
              <div className="rounded-xl bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.07]">
                <p className="flex items-center gap-1.5 text-xs text-white/50">
                  <CircleX className="h-4 w-4 text-red-300" />
                  Failed
                </p>
                <p className="mt-2 text-xl font-semibold text-red-200">{result.failed_count ?? 0}</p>
              </div>
              <div className="rounded-xl bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.07]">
                <p className="text-xs text-white/50">Total Rows</p>
                <p className="mt-2 text-xl font-semibold text-white">{result.total_rows ?? 0}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white">Errors</h3>
              {Array.isArray(result.errors) && result.errors.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-red-200/90">
                  {result.errors.map((e: { row: number; error: string }, idx: number) => (
                    <li key={`${e.row}-${idx}`}>
                      Row {e.row}: {e.error}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-white/45">No row errors.</p>
              )}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
