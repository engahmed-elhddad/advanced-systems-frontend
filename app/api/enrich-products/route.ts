import { NextResponse } from "next/server"

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

// Admin key is kept server-side only (no NEXT_PUBLIC_ prefix).
const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? "ADVANCED_SYSTEMS_ADMIN"

/**
 * POST /api/enrich-products
 *
 * Proxies the enrichment request to the FastAPI backend so that
 * ``ADMIN_API_KEY`` stays server-side and is never exposed to the browser.
 */
export async function POST() {
  try {
    const res = await fetch(`${API}/admin/enrich-products`, {
      method: "POST",
      headers: { "api-key": ADMIN_API_KEY },
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown error")
      return NextResponse.json(
        { error: `Backend error (${res.status}): ${text}` },
        { status: res.status }
      )
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
