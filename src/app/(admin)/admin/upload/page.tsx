"use client";

import { useState } from "react";
import { uploadProductsCsv } from "@/lib/admin-api";
import { FileUp, ShieldAlert, CircleCheck, CircleX, Rows3 } from "lucide-react";

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [strict, setStrict] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await uploadProductsCsv(file, strict);
      if (!res.ok) {
        setError(res?.data?.message || res?.data?.detail || "Upload failed");
        return;
      }
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="admin-title">Upload CSV</h1>
        <p className="admin-subtitle">Import products with validation and per-row errors.</p>
      </div>

      <div className="admin-card space-y-3">
        <input
          type="file"
          accept=".csv,.json"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
          <ShieldAlert className="admin-icon text-amber-600" />
          Strict mode (reject unknown fields)
        </label>
        <div>
          <button
            disabled={!file || loading}
            onClick={handleUpload}
            className="admin-btn-primary"
          >
            <FileUp className="admin-icon" />
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {result && (
        <div className="admin-card">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><Rows3 className="admin-icon" /> Import Result</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="flex items-center gap-1.5 text-slate-500"><CircleCheck className="admin-icon text-green-600" /> Success</p>
              <p className="text-xl font-semibold text-green-700">{result.success_count ?? 0}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="flex items-center gap-1.5 text-slate-500"><CircleX className="admin-icon text-red-600" /> Failed</p>
              <p className="text-xl font-semibold text-red-700">{result.failed_count ?? 0}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="text-slate-500">Total Rows</p>
              <p className="text-xl font-semibold text-slate-900">{result.total_rows ?? 0}</p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-900">Errors</h3>
            {Array.isArray(result.errors) && result.errors.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {result.errors.map((e: { row: number; error: string }, idx: number) => (
                  <li key={`${e.row}-${idx}`}>Row {e.row}: {e.error}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-slate-500">No row errors.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
