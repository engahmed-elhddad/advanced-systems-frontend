"use client"

import { useState } from "react"
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

export default function BulkImport() {
  const [file, setFile] = useState(null)

  const upload = async () => {
    const key = (process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? "").trim()
    if (!key) {
      alert("Set NEXT_PUBLIC_ADMIN_API_KEY in .env.local")
      return
    }
    const form = new FormData()
    form.append("file", file)
    await apiFetch(`${API}/admin/bulk-import`, {
      method: "POST",
      headers: { "api-key": key },
      body: form,
    })
    alert("Bulk Import Done")
  }

  return (
    <div className="px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-white">Bulk Import ZIP</h1>
      <div className="flex items-center gap-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="text-sm text-white/70 file:mr-4 file:rounded-lg file:border file:border-white/10 file:bg-white/[0.04] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white/80 file:transition hover:file:bg-white/[0.08]"
        />
        <Button variant="primary" onClick={upload} disabled={!file}>
          Upload
        </Button>
      </div>
    </div>
  )
}
