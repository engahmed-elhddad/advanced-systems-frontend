import { NextRequest, NextResponse } from "next/server"
import { requireBackendAdmin } from "@/lib/serverAdminAuth"

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

function serverAdminApiKey(): string | undefined {
  const k = process.env.ADMIN_API_KEY?.trim()
  return k || undefined
}

/**
 * POST /api/enrich-products
 *
 * Proxies the enrichment request to the FastAPI backend so that
 * ``ADMIN_API_KEY`` stays server-side and is never exposed to the browser.
 */
export async function POST(request: NextRequest) {
  const authFailure = await requireBackendAdmin(request)
  if (authFailure) return authFailure

  const adminKey = serverAdminApiKey()
  if (!adminKey) {
    return NextResponse.json(
      { error: "ADMIN_API_KEY is not configured on the server" },
      { status: 503 }
    )
  }
  try {
    const res = await fetch(`${API}/admin/enrich-products`, {
      method: "POST",
      headers: { "api-key": adminKey },
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
