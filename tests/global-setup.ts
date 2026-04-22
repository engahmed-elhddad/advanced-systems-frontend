/**
 * Fail-fast: staging API health + persistent admin session for reuse in tests.
 */
import { randomBytes } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { FullConfig } from '@playwright/test'
import { chromium } from '@playwright/test'
import { loadE2eEnv } from './load-e2e-env'
import { requireAdminLoginEnv } from './load-e2e-env'
import { getApiBaseUrl, getBrowserBaseUrl, getHealthUrl } from './e2e-target'

const LATENCY_WARN_MS = 3000

export default async function globalSetup(_config: FullConfig): Promise<void> {
  loadE2eEnv()

  const suiteRunId = `${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`
  const markerPath = path.join(process.cwd(), 'playwright', '.e2e-suite-marker.json')
  fs.mkdirSync(path.dirname(markerPath), { recursive: true })
  fs.writeFileSync(
    markerPath,
    JSON.stringify({ suiteRunId, createdAt: new Date().toISOString() }, null, 2),
    'utf8',
  )
  // eslint-disable-next-line no-console
  console.log(`[global-setup] E2E suite run id → ${suiteRunId} (marker ${markerPath})`)

  const healthUrl = getHealthUrl()
  const t0 = Date.now()
  let res: Response
  try {
    res = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: 'application/json' },
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    throw new Error(
      `Staging API is DOWN: cannot reach ${healthUrl} (${err}). ` +
        'Check E2E_API_BASE_URL / NEXT_PUBLIC_API_URL points at the live FastAPI host (not Next-only if /health is not proxied).',
    )
  }
  const ms = Date.now() - t0
  // eslint-disable-next-line no-console
  console.log(`[global-setup] GET ${healthUrl} → ${res.status} in ${ms}ms`)
  if (ms > LATENCY_WARN_MS) {
    // eslint-disable-next-line no-console
    console.warn(`[global-setup] High latency ${ms}ms (>${LATENCY_WARN_MS}ms) — staging may be slow or far away.`)
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Staging API is DOWN: GET ${healthUrl} returned ${res.status} ${res.statusText}. Body: ${text.slice(0, 500)}`,
    )
  }

  const authDir = path.join(process.cwd(), 'playwright', '.auth')
  fs.mkdirSync(authDir, { recursive: true })
  const storagePath = path.join(authDir, 'admin.json')

  const browser = await chromium.launch({ headless: true })
  const baseURL = getBrowserBaseUrl()
  const context = await browser.newContext({ baseURL, ignoreHTTPSErrors: false })
  const page = await context.newPage()

  const { email, password } = requireAdminLoginEnv()

  await page.goto('/admin/login', { waitUntil: 'load', timeout: 90_000 })
  await page.getByLabel('Email').waitFor({ state: 'visible', timeout: 30_000 })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await Promise.all([
    page.waitForURL(/\/admin\/?$/i, { timeout: 90_000 }),
    page.getByRole('button', { name: /sign in/i }).click(),
  ])

  await context.storageState({ path: storagePath })
  await browser.close()

  // eslint-disable-next-line no-console
  console.log(`[global-setup] Saved admin storageState → ${storagePath} (API base ${getApiBaseUrl()})`)
}
