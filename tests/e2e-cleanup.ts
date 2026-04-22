/**
 * Guaranteed E2E product cleanup: retries, storageState auth fallback, tag-based discovery.
 * Tag rule: product **name** must start with `[E2E]` (see e2e-isolation uniqueProductName).
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { APIRequestContext, Page, TestInfo } from '@playwright/test'
import { request as playwrightRequest } from '@playwright/test'
import { getApiBaseUrl } from './e2e-target'
import { loadE2eEnv } from './load-e2e-env'
import { E2E_FAIL, e2eLog } from './e2e-isolation'

const STORAGE_STATE = path.join(process.cwd(), 'playwright', '.auth', 'admin.json')

/** Log prefixes — distinguish throttling vs transport vs non-retryable API errors. */
export const CLEANUP_DOMAIN = {
  RATE_LIMIT: '[RATE_LIMIT]',
  NETWORK: '[NETWORK]',
  REAL_FAILURE: '[REAL_FAILURE]',
  AUTH: '[AUTH]',
} as const

export type CleanupFailureDomain = (typeof CLEANUP_DOMAIN)[keyof typeof CLEANUP_DOMAIN]

const _batchEnv = Number(process.env.E2E_CLEANUP_BATCH_SIZE)
const DELETE_BATCH_SIZE = Number.isFinite(_batchEnv) ? Math.min(10, Math.max(5, _batchEnv)) : 8
const DELETE_ATTEMPTS_TRANSIENT = Math.max(1, Number(process.env.E2E_DELETE_ATTEMPTS_TRANSIENT) || 8)
const DELETE_ATTEMPTS_STRICT = Math.max(1, Number(process.env.E2E_DELETE_ATTEMPTS_STRICT) || 3)
const DELETE_BASE_BACKOFF_MS = Math.max(50, Number(process.env.E2E_DELETE_BACKOFF_BASE_MS) || 400)
const DELETE_MAX_BACKOFF_MS = Math.max(500, Number(process.env.E2E_DELETE_BACKOFF_MAX_MS) || 30_000)
const INTER_BATCH_DELAY_MS = Math.max(0, Number(process.env.E2E_CLEANUP_INTER_BATCH_MS) || 250)
const INTER_BATCH_DELAY_AFTER_429_MS = Math.max(
  INTER_BATCH_DELAY_MS,
  Number(process.env.E2E_CLEANUP_INTER_BATCH_429_MS) || 5_000,
)

const CLEANUP_PER_TEST_DEADLINE_MS = Math.max(10_000, Number(process.env.E2E_CLEANUP_DEADLINE_MS) || 120_000)
const CLEANUP_GLOBAL_PURGE_DEADLINE_MS = Math.max(30_000, Number(process.env.E2E_GLOBAL_PURGE_DEADLINE_MS) || 300_000)

const LIST_MAX_PAGES = 40
const FULL_LIST_SCAN_MAX_PAGES = 40
const LIST_PER_PAGE = 100
const LIST_FETCH_ATTEMPTS = Math.max(1, Number(process.env.E2E_LIST_FETCH_ATTEMPTS) || 6)
const LIST_FETCH_BASE_BACKOFF_MS = Math.max(100, Number(process.env.E2E_LIST_FETCH_BACKOFF_MS) || 500)

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function jitterMs(max = 120): number {
  return Math.floor(Math.random() * max)
}

function classifyHttpStatus(status: number): CleanupFailureDomain {
  if (status === 401 || status === 403) return CLEANUP_DOMAIN.AUTH
  if (status === 429) return CLEANUP_DOMAIN.RATE_LIMIT
  if (status === 408 || (status >= 500 && status <= 599)) return CLEANUP_DOMAIN.NETWORK
  return CLEANUP_DOMAIN.REAL_FAILURE
}

function isTransientListOrDeleteFailure(status: number): boolean {
  return status === 429 || status === 408 || (status >= 500 && status <= 599)
}

function readRetryAfterHeaderMs(headers: { [key: string]: string }): number | null {
  const raw = headers['retry-after'] ?? headers['Retry-After']
  if (raw == null || raw === '') return null
  const sec = Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(sec) || sec < 0) return null
  return Math.min(DELETE_MAX_BACKOFF_MS, sec * 1000)
}

function backoffBeforeRetryMs(params: {
  attemptIndex: number
  lastStatus: number
  retryAfterMs: number | null
}): number {
  const { attemptIndex, lastStatus, retryAfterMs } = params
  if (retryAfterMs != null && retryAfterMs > 0) {
    return Math.min(DELETE_MAX_BACKOFF_MS, retryAfterMs + jitterMs(80))
  }
  const exp = DELETE_BASE_BACKOFF_MS * 2 ** Math.max(0, attemptIndex - 1)
  const rateMult = lastStatus === 429 ? 2.5 : 1
  return Math.min(DELETE_MAX_BACKOFF_MS, Math.floor(exp * rateMult + jitterMs(100)))
}

function assertWithinCleanupDeadline(
  startedAt: number,
  budgetMs: number,
  context: string,
  pendingHint: string,
): void {
  const elapsed = Date.now() - startedAt
  if (elapsed <= budgetMs) return
  throw new Error(
    `[E2E_CLEANUP_TIMEOUT] ${context}: budget ${budgetMs}ms exceeded (elapsed=${elapsed}ms). ` +
      `${pendingHint} — staging may be overloaded or API stuck; increase E2E_CLEANUP_DEADLINE_MS / E2E_GLOBAL_PURGE_DEADLINE_MS if appropriate.`,
  )
}

function listBackoffBeforeRetryMs(
  attemptIndex: number,
  lastStatus: number,
  retryAfterMs: number | null,
): number {
  if (retryAfterMs != null && retryAfterMs > 0) {
    return Math.min(DELETE_MAX_BACKOFF_MS, retryAfterMs + jitterMs(80))
  }
  const exp = LIST_FETCH_BASE_BACKOFF_MS * 2 ** Math.max(0, attemptIndex - 1)
  const rateMult = lastStatus === 429 ? 3 : 1
  return Math.min(DELETE_MAX_BACKOFF_MS, Math.floor(exp * rateMult + jitterMs(100)))
}

export function tenantHeader(): Record<string, string> {
  const tid = (process.env.NEXT_PUBLIC_TENANT_ID || 'default').trim() || 'default'
  return { 'X-Tenant-Id': tid, 'Content-Type': 'application/json' }
}

/** Bearer from Playwright storageState JSON (localStorage admin_token). */
export function extractBearerFromStorageState(storagePath = STORAGE_STATE): string | null {
  try {
    const raw = fs.readFileSync(storagePath, 'utf8')
    const data = JSON.parse(raw) as {
      origins?: Array<{ localStorage?: Array<{ name: string; value: string }> }>
    }
    for (const o of data.origins ?? []) {
      for (const row of o.localStorage ?? []) {
        if (row.name === 'admin_token' && row.value?.trim()) return row.value.trim()
      }
    }
  } catch {
    return null
  }
  return null
}

async function resolveAuthHeader(page: Page | null): Promise<string | null> {
  if (page) {
    try {
      const t = await page.evaluate(() => localStorage.getItem('admin_token'))
      if (t?.trim()) return t.trim()
    } catch {
      /* closed page */
    }
  }
  return extractBearerFromStorageState()
}

export async function adminApiHeaders(page: Page | null): Promise<Record<string, string>> {
  const h: Record<string, string> = { ...tenantHeader() }
  const token = await resolveAuthHeader(page)
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

/** Product rows created by this harness (strict — avoids deleting unrelated E2E-* part numbers). */
export function isTaggedE2eProduct(row: { name?: string | null; part_number?: string | null }): boolean {
  const n = (row.name ?? '').trim()
  return n.startsWith('[E2E]')
}

type ListPayload = { items?: Array<{ id?: number; name?: string; part_number?: string }>; total?: number }

export type TaggedE2eProductRow = { id: number; name: string; part_number?: string | null }

function mergeTaggedRows(
  items: Array<{ id?: number; name?: string; part_number?: string }> | undefined,
  byId: Map<number, TaggedE2eProductRow>,
): void {
  for (const row of items ?? []) {
    const id = row.id
    if (typeof id !== 'number' || !Number.isFinite(id)) continue
    if (!isTaggedE2eProduct(row)) continue
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        name: (row.name ?? '').trim(),
        part_number: row.part_number ?? null,
      })
    }
  }
}

/**
 * All products whose name starts with `[E2E]` — union of admin list search `E2E-`
 * and a capped paginated scan **without** search (catches tagged rows whose part_number
 * does not contain `E2E-`).
 */
export type CleanupDeadlineOpts = { startedAt: number; budgetMs: number }

export async function listTaggedE2eProductsThorough(
  api: APIRequestContext,
  base: string,
  headers: Record<string, string>,
  deadline?: CleanupDeadlineOpts,
): Promise<TaggedE2eProductRow[]> {
  if (!headers.Authorization) {
    throw new Error(`[E2E cleanup] ${E2E_FAIL.AUTH} no Bearer — cannot list tagged products`)
  }
  const fetchOpts =
    deadline != null
      ? { deadlineStartedAt: deadline.startedAt, deadlineMs: deadline.budgetMs }
      : undefined
  const byId = new Map<number, TaggedE2eProductRow>()

  for (let p = 1; p <= LIST_MAX_PAGES; p += 1) {
    const body = await fetchAdminProductsPage(api, base, headers, p, 'E2E-', fetchOpts)
    const items = body.items ?? []
    mergeTaggedRows(items, byId)
    const total = typeof body.total === 'number' ? body.total : items.length
    if (items.length < LIST_PER_PAGE || p * LIST_PER_PAGE >= total) break
  }

  for (let p = 1; p <= FULL_LIST_SCAN_MAX_PAGES; p += 1) {
    const body = await fetchAdminProductsPage(api, base, headers, p, undefined, fetchOpts)
    const items = body.items ?? []
    mergeTaggedRows(items, byId)
    const total = typeof body.total === 'number' ? body.total : items.length
    if (items.length < LIST_PER_PAGE || p * LIST_PER_PAGE >= total) break
  }

  return [...byId.values()]
}

async function fetchAdminProductsPage(
  api: APIRequestContext,
  base: string,
  headers: Record<string, string>,
  page: number,
  search?: string,
  opts?: { deadlineStartedAt?: number; deadlineMs?: number },
): Promise<ListPayload> {
  const q = new URLSearchParams({
    page: String(page),
    per_page: String(LIST_PER_PAGE),
    size: String(LIST_PER_PAGE),
  })
  if (search != null && search !== '') q.set('search', search)
  const url = `${base}/api/v1/admin/products?${q.toString()}`
  let lastStatus = 0
  let lastDomain: CleanupFailureDomain = CLEANUP_DOMAIN.REAL_FAILURE

  for (let attempt = 1; attempt <= LIST_FETCH_ATTEMPTS; attempt += 1) {
    if (opts?.deadlineStartedAt != null && opts.deadlineMs != null) {
      assertWithinCleanupDeadline(
        opts.deadlineStartedAt,
        opts.deadlineMs,
        'admin products list',
        `list page=${page} search=${search ?? '(none)'} attempt=${attempt}/${LIST_FETCH_ATTEMPTS}`,
      )
    }

    const res = await api.get(url, { headers })
    lastStatus = res.status()
    if (res.ok()) return (await res.json()) as ListPayload

    lastDomain = classifyHttpStatus(lastStatus)
    const retryAfterMs = readRetryAfterHeaderMs(res.headers())
    const t = await res.text().catch(() => '')

    if (lastDomain === CLEANUP_DOMAIN.AUTH || !isTransientListOrDeleteFailure(lastStatus)) {
      throw new Error(
        `[E2E cleanup] ${lastDomain} list products HTTP ${lastStatus} page=${page} ` +
          `search=${search ?? '(none)'} body=${t.slice(0, 300)}`,
      )
    }

    if (attempt >= LIST_FETCH_ATTEMPTS) {
      throw new Error(
        `[E2E cleanup] ${lastDomain} list products failed after ${LIST_FETCH_ATTEMPTS} attempts ` +
          `(last HTTP ${lastStatus}) page=${page} search=${search ?? '(none)'} body=${t.slice(0, 300)}`,
      )
    }

    const backoff = listBackoffBeforeRetryMs(attempt, lastStatus, retryAfterMs)
    // eslint-disable-next-line no-console
    console.log(
      `[E2E cleanup] ${lastDomain} list GET backoff=${backoff}ms (attempt ${attempt}/${LIST_FETCH_ATTEMPTS}) HTTP=${lastStatus}`,
    )
    await sleep(backoff)
  }

  throw new Error(`[E2E cleanup] list products exhausted retries (last HTTP ${lastStatus}, ${lastDomain})`)
}

/** Collect ids of products whose name is tagged `[E2E]...` (fast path: search=E2E- only). */
export async function discoverTaggedE2eProductIds(
  api: APIRequestContext,
  base: string,
  headers: Record<string, string>,
  deadline?: CleanupDeadlineOpts,
): Promise<number[]> {
  if (!headers.Authorization) {
    throw new Error(`[E2E cleanup] ${E2E_FAIL.AUTH} no Bearer — cannot discover tagged products`)
  }
  const fetchOpts =
    deadline != null
      ? { deadlineStartedAt: deadline.startedAt, deadlineMs: deadline.budgetMs }
      : undefined
  const ids = new Set<number>()
  for (let p = 1; p <= LIST_MAX_PAGES; p += 1) {
    const body = await fetchAdminProductsPage(api, base, headers, p, 'E2E-', fetchOpts)
    const items = body.items ?? []
    for (const row of items) {
      const id = row.id
      if (typeof id !== 'number' || !Number.isFinite(id)) continue
      if (isTaggedE2eProduct(row)) ids.add(id)
    }
    const total = typeof body.total === 'number' ? body.total : items.length
    if (items.length < LIST_PER_PAGE || p * LIST_PER_PAGE >= total) break
  }
  return [...ids]
}

export type DeleteWithRetryResult = {
  ok: boolean
  lastStatus: number
  attempts: number
  /** Set when `ok` is false; null on success. */
  lastDomain: CleanupFailureDomain | null
}

export async function deleteProductWithRetry(
  api: APIRequestContext,
  base: string,
  headers: Record<string, string>,
  productId: number,
  log?: (msg: string) => void,
  deadline?: CleanupDeadlineOpts,
): Promise<DeleteWithRetryResult> {
  if (!headers.Authorization) {
    log?.(`${CLEANUP_DOMAIN.AUTH} delete id=${productId} skipped — no Authorization header`)
    return { ok: false, lastStatus: 0, attempts: 0, lastDomain: CLEANUP_DOMAIN.AUTH }
  }

  let effectiveMaxAttempts = DELETE_ATTEMPTS_STRICT
  let lastStatus = 0
  let lastDomain: CleanupFailureDomain = CLEANUP_DOMAIN.REAL_FAILURE
  let attempt = 0

  while (attempt < effectiveMaxAttempts) {
    attempt += 1
    if (deadline != null) {
      assertWithinCleanupDeadline(
        deadline.startedAt,
        deadline.budgetMs,
        'DELETE product',
        `id=${productId} attempt=${attempt}/${effectiveMaxAttempts}`,
      )
    }

    const res = await api.delete(`${base}/api/v1/admin/products/${productId}`, { headers })
    lastStatus = res.status()
    lastDomain = classifyHttpStatus(lastStatus)
    const retryAfterMs = readRetryAfterHeaderMs(res.headers())

    log?.(
      `[CLEANUP] delete id=${productId} attempt=${attempt}/${effectiveMaxAttempts} HTTP=${lastStatus} domain=${lastDomain}` +
        (retryAfterMs != null ? ` Retry-After≈${retryAfterMs}ms` : ''),
    )

    if (res.ok() || lastStatus === 404) {
      return { ok: true, lastStatus, attempts: attempt, lastDomain: null }
    }

    if (lastDomain === CLEANUP_DOMAIN.AUTH) {
      log?.(`${lastDomain} delete id=${productId} — stopping (auth not retryable here)`)
      return { ok: false, lastStatus, attempts: attempt, lastDomain }
    }

    if (isTransientListOrDeleteFailure(lastStatus)) {
      const prev = effectiveMaxAttempts
      effectiveMaxAttempts = Math.max(effectiveMaxAttempts, DELETE_ATTEMPTS_TRANSIENT)
      if (effectiveMaxAttempts > prev) {
        log?.(
          `${lastDomain} delete id=${productId} — raising retry budget ${prev}→${effectiveMaxAttempts} (transient errors)`,
        )
      }
    }

    if (attempt >= effectiveMaxAttempts) break

    const backoffMs = backoffBeforeRetryMs({
      attemptIndex: attempt,
      lastStatus,
      retryAfterMs,
    })
    log?.(`${lastDomain} delete id=${productId} sleeping ${backoffMs}ms before retry (exponential backoff)`)
    await sleep(backoffMs)
  }

  return { ok: false, lastStatus, attempts: attempt, lastDomain }
}

function chunkIds(ids: number[], batchSize: number): number[][] {
  const batches: number[][] = []
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize))
  }
  return batches
}

/** Tracked ids first, then tag-discovery sweep (same suite / crashed-before-track). */
export async function cleanupTrackedAndTaggedOrphans(
  page: Page | null,
  api: APIRequestContext,
  testInfo: TestInfo | undefined,
  trackedIds: Iterable<number>,
): Promise<{ deleted: number; failed: number }> {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const headers = await adminApiHeaders(page)
  const log = testInfo ? (msg: string) => e2eLog(testInfo, msg) : (msg: string) => console.log(`[E2E cleanup] ${msg}`)
  const startedAt = Date.now()
  const deadline: CleanupDeadlineOpts = { startedAt, budgetMs: CLEANUP_PER_TEST_DEADLINE_MS }

  const toDelete = new Set<number>()
  for (const id of trackedIds) {
    if (typeof id === 'number' && Number.isFinite(id)) toDelete.add(id)
  }

  if (!headers.Authorization) {
    if (toDelete.size > 0) {
      throw new Error(
        `[E2E_CLEANUP_FAILED] ${E2E_FAIL.AUTH} no Bearer (page + storageState) — cannot DELETE ${toDelete.size} tracked/tagged product(s)`,
      )
    }
    log(`${E2E_FAIL.AUTH} cleanup: no Bearer and nothing tracked — skipping`)
    return { deleted: 0, failed: 0 }
  }

  try {
    const discovered = await discoverTaggedE2eProductIds(api, base, headers, deadline)
    for (const id of discovered) toDelete.add(id)
    log(`fallback discovery: ${discovered.length} tagged [E2E] product id(s) via search=E2E-`)
  } catch (e) {
    log(`fallback discovery failed: ${String(e)}`)
    throw e
  }

  const idsSorted = [...toDelete].sort((a, b) => a - b)
  const batches = chunkIds(idsSorted, DELETE_BATCH_SIZE)
  log(
    `[CLEANUP] delete plan: ${idsSorted.length} id(s) in ${batches.length} batch(es) ` +
      `(batchSize≤${DELETE_BATCH_SIZE}) budget=${deadline.budgetMs}ms`,
  )

  let deleted = 0
  const failures: Array<{ id: number; lastStatus: number; lastDomain: CleanupFailureDomain | null }> = []

  for (let bi = 0; bi < batches.length; bi += 1) {
    assertWithinCleanupDeadline(
      deadline.startedAt,
      deadline.budgetMs,
      'per-test cleanup',
      `before batch ${bi + 1}/${batches.length}`,
    )
    const batch = batches[bi]!
    log(`[CLEANUP] batch ${bi + 1}/${batches.length} size=${batch.length}`)
    let batchHad429 = false

    for (const id of batch) {
      assertWithinCleanupDeadline(
        deadline.startedAt,
        deadline.budgetMs,
        'per-test cleanup',
        `inside batch ${bi + 1} id=${id}`,
      )
      const r = await deleteProductWithRetry(api, base, headers, id, log, deadline)
      if (r.ok) deleted += 1
      else failures.push({ id, lastStatus: r.lastStatus, lastDomain: r.lastDomain })
      if (r.lastStatus === 429) batchHad429 = true
    }

    if (bi < batches.length - 1) {
      const pauseMs = batchHad429 ? INTER_BATCH_DELAY_AFTER_429_MS : INTER_BATCH_DELAY_MS
      log(
        `[CLEANUP] inter-batch pause ${pauseMs}ms after batch ${bi + 1} ` +
          `(RATE_LIMIT=${batchHad429 ? 'yes' : 'no'})`,
      )
      await sleep(pauseMs)
    }
  }

  if (failures.length > 0) {
    const detail = failures
      .map((f) => `id=${f.id} HTTP=${f.lastStatus} domain=${f.lastDomain ?? 'unknown'}`)
      .join('; ')
    throw new Error(
      `[E2E_CLEANUP_FAILED] DELETE exhausted retries for ${failures.length} product(s): ${detail}. ` +
        `See logs for ${CLEANUP_DOMAIN.RATE_LIMIT} / ${CLEANUP_DOMAIN.NETWORK} vs ${CLEANUP_DOMAIN.REAL_FAILURE}.`,
    )
  }
  return { deleted, failed: 0 }
}

/** Global teardown: purge every `[E2E]`-tagged product; then verify none remain. */
export async function purgeAllTaggedE2eProductsAndAssertClean(): Promise<{
  deleted: number
  remaining: number
  remainingSample: string
}> {
  loadE2eEnv()
  const base = getApiBaseUrl().replace(/\/$/, '')
  const token = extractBearerFromStorageState()
  if (!token) {
    throw new Error(
      '[E2E global-teardown] No admin_token in storageState — cannot purge (re-run global-setup / login).',
    )
  }
  const headers: Record<string, string> = {
    ...tenantHeader(),
    Authorization: `Bearer ${token}`,
  }

  const api = await playwrightRequest.newContext({ baseURL: base })
  const purgeStartedAt = Date.now()
  const purgeDeadline: CleanupDeadlineOpts = {
    startedAt: purgeStartedAt,
    budgetMs: CLEANUP_GLOBAL_PURGE_DEADLINE_MS,
  }
  try {
    let round = 0
    let deletedTotal = 0
    while (round < 8) {
      assertWithinCleanupDeadline(
        purgeDeadline.startedAt,
        purgeDeadline.budgetMs,
        'global purge',
        `before list round (completed rounds=${round})`,
      )
      const rows = await listTaggedE2eProductsThorough(api, base, headers, purgeDeadline)
      if (rows.length === 0) break
      round += 1
      const idBatches = chunkIds(
        rows.map((r) => r.id),
        DELETE_BATCH_SIZE,
      )
      // eslint-disable-next-line no-console
      console.log(
        `[E2E global-teardown] purge round ${round}: ${rows.length} tagged [E2E] product(s) ` +
          `in ${idBatches.length} delete batch(es) (batchSize≤${DELETE_BATCH_SIZE})`,
      )
      for (let bi = 0; bi < idBatches.length; bi += 1) {
        assertWithinCleanupDeadline(
          purgeDeadline.startedAt,
          purgeDeadline.budgetMs,
          'global purge',
          `round ${round} batch ${bi + 1}/${idBatches.length}`,
        )
        const batch = idBatches[bi]!
        // eslint-disable-next-line no-console
        console.log(`[E2E global-teardown] round ${round} delete batch ${bi + 1}/${idBatches.length} size=${batch.length}`)
        let batchHad429 = false
        for (const id of batch) {
          assertWithinCleanupDeadline(
            purgeDeadline.startedAt,
            purgeDeadline.budgetMs,
            'global purge',
            `round ${round} deleting id=${id}`,
          )
          const r = await deleteProductWithRetry(
            api,
            base,
            headers,
            id,
            (m) => console.log(`[E2E global-teardown] ${m}`),
            purgeDeadline,
          )
          if (r.ok) deletedTotal += 1
          else {
            // eslint-disable-next-line no-console
            console.error(
              `[E2E global-teardown] ${r.lastDomain ?? CLEANUP_DOMAIN.REAL_FAILURE} ` +
                `delete not OK id=${id} HTTP=${r.lastStatus} attempts=${r.attempts}`,
            )
          }
          if (r.lastStatus === 429) batchHad429 = true
        }
        if (bi < idBatches.length - 1) {
          const pauseMs = batchHad429 ? INTER_BATCH_DELAY_AFTER_429_MS : INTER_BATCH_DELAY_MS
          // eslint-disable-next-line no-console
          console.log(
            `[E2E global-teardown] inter-batch pause ${pauseMs}ms (${CLEANUP_DOMAIN.RATE_LIMIT}=${batchHad429 ? 'yes' : 'no'})`,
          )
          await sleep(pauseMs)
        }
      }
    }

    const remaining = await listTaggedE2eProductsThorough(api, base, headers, purgeDeadline)
    if (remaining.length > 0) {
      const lines = remaining
        .slice(0, 50)
        .map((r) => `  id=${r.id} name=${JSON.stringify(r.name)} part_number=${JSON.stringify(r.part_number ?? '')}`)
        .join('\n')
      throw new Error(
        `[E2E_DATA_LEAK] After global purge (${round} round(s)), ${remaining.length} tagged [E2E] product(s) still exist.\n` +
          `Leaked items (sample up to 50):\n${lines}`,
      )
    }
    // eslint-disable-next-line no-console
    console.log(
      `[E2E global-teardown] purge complete; deleted≈${deletedTotal} over ${round} round(s); leak check: 0 [E2E] rows`,
    )
    return { deleted: deletedTotal, remaining: 0, remainingSample: '' }
  } finally {
    await api.dispose()
  }
}
