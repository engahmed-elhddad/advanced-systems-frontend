import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/constants'

type Counts = {
  products_count: number | null
  brands_count: number | null
  categories_count: number | null
}

const MAX_DELTA_RATIO = 0.05
const COUNT_WARNING_THRESHOLD = 40_000

function countUrls(xml: string): number {
  const matches = xml.match(/<url>/g)
  return matches ? matches.length : 0
}

function getAuthSecret(): string | null {
  return process.env.CRON_SECRET?.trim() || process.env.E2E_CRON_SECRET?.trim() || null
}

function summarizeStatus(values: Array<number | null>): 'success' | 'partial' | 'failed' {
  const successCount = values.filter((v) => v !== null).length
  if (successCount === values.length) return 'success'
  if (successCount === 0) return 'failed'
  return 'partial'
}

function deltaAnomaly(current: Counts, previous: Counts | null): boolean {
  if (!previous) return false
  const pairs: Array<[number | null, number | null]> = [
    [current.products_count, previous.products_count],
    [current.brands_count, previous.brands_count],
    [current.categories_count, previous.categories_count],
  ]
  return pairs.some(([cur, prev]) => {
    if (cur == null || prev == null) return false
    const baseline = prev <= 0 ? 1 : prev
    return Math.abs(cur - prev) / baseline > MAX_DELTA_RATIO
  })
}

function countWarning(current: Counts): Record<string, boolean> | null {
  const warning = {
    products: (current.products_count ?? 0) > COUNT_WARNING_THRESHOLD,
    brands: (current.brands_count ?? 0) > COUNT_WARNING_THRESHOLD,
    categories: (current.categories_count ?? 0) > COUNT_WARNING_THRESHOLD,
  }
  return warning.products || warning.brands || warning.categories ? warning : null
}

async function fetchLatestAudit(authHeader: string): Promise<Counts | null> {
  const response = await fetch(`${API_BASE_URL}/api/internal/sitemap-audit/latest`, {
    method: 'GET',
    headers: { Authorization: authHeader },
    cache: 'no-store',
  })
  if (!response.ok) return null
  const payload = (await response.json()) as {
    row?: {
      products_count?: number | null
      brands_count?: number | null
      categories_count?: number | null
    } | null
  }
  if (!payload.row) return null
  return {
    products_count: payload.row.products_count ?? null,
    brands_count: payload.row.brands_count ?? null,
    categories_count: payload.row.categories_count ?? null,
  }
}

export async function GET(request: NextRequest) {
  const secret = getAuthSecret()
  const incomingAuth = request.headers.get('authorization')?.trim() || ''
  const expectedAuth = secret ? `Bearer ${secret}` : ''
  if (!secret || incomingAuth !== expectedAuth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  const origin = request.nextUrl.origin
  const errors: string[] = []
  const counts: Counts = {
    products_count: null,
    brands_count: null,
    categories_count: null,
  }

  const targets: Array<{ key: keyof Counts; path: string }> = [
    { key: 'products_count', path: '/sitemap-products.xml' },
    { key: 'brands_count', path: '/sitemap-brands.xml' },
    { key: 'categories_count', path: '/sitemap-categories.xml' },
  ]

  for (const target of targets) {
    try {
      const response = await fetch(`${origin}${target.path}`, { cache: 'no-store' })
      if (!response.ok) {
        errors.push(`${target.path} -> HTTP ${response.status}`)
        continue
      }
      const xml = await response.text()
      counts[target.key] = countUrls(xml)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${target.path} -> ${message}`)
    }
  }

  const previous = await fetchLatestAudit(expectedAuth).catch(() => null)
  const status = summarizeStatus([counts.products_count, counts.brands_count, counts.categories_count])
  const durationSeconds = Number(((Date.now() - started) / 1000).toFixed(3))
  const anomaly = deltaAnomaly(counts, previous)
  const warning = countWarning(counts)
  const errorExcerpt = errors.length > 0 ? errors[0]!.slice(0, 500) : null

  await fetch(`${API_BASE_URL}/api/internal/sitemap-audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: expectedAuth,
    },
    body: JSON.stringify({
      status,
      products_count: counts.products_count,
      brands_count: counts.brands_count,
      categories_count: counts.categories_count,
      duration_seconds: durationSeconds,
      delta_anomaly: anomaly,
      count_warning: warning,
      error_excerpt: errorExcerpt,
      tenant_id: 'default',
    }),
    cache: 'no-store',
  }).catch(() => undefined)

  return NextResponse.json({
    status,
    products_count: counts.products_count,
    brands_count: counts.brands_count,
    categories_count: counts.categories_count,
    duration_seconds: durationSeconds,
    delta_anomaly: anomaly,
    count_warning: warning,
  })
}
