/**
 * Test isolation: unique identifiers, run-scoped logging, failure-domain prefixes.
 * No static part numbers or shared names across tests.
 *
 * Product names use `[E2E][suiteRunId][timestamp] …` so global teardown can find
 * orphans even when the test never recorded the product id.
 */
import { randomBytes } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { TestInfo } from '@playwright/test'

const SUITE_MARKER_PATH = path.join(process.cwd(), 'playwright', '.e2e-suite-marker.json')

/** Written by `global-setup.ts` once per Playwright run; read by specs and isolation helpers. */
export function readSuiteRunId(): string {
  try {
    const raw = fs.readFileSync(SUITE_MARKER_PATH, 'utf8')
    const j = JSON.parse(raw) as { suiteRunId?: string }
    if (j.suiteRunId?.trim()) return j.suiteRunId.trim()
  } catch {
    /* missing or invalid marker */
  }
  const env = process.env.E2E_SUITE_RUN_ID?.trim()
  if (env) return env
  return `local-${Date.now()}`
}

/** Use in expect(message) / thrown errors so CI triage sees category first. */
export const E2E_FAIL = {
  AUTH: '[AUTH]',
  NETWORK: '[NETWORK]',
  DATA_CONFLICT: '[DATA_CONFLICT]',
  ENV: '[ENV]',
  BUG: '[BUG]',
  UI: '[UI]',
} as const

const logLinesByTestId = new Map<string, string[]>()

function linesFor(testInfo: TestInfo): string[] {
  let arr = logLinesByTestId.get(testInfo.testId)
  if (!arr) {
    arr = []
    logLinesByTestId.set(testInfo.testId, arr)
  }
  return arr
}

/** Append one ISO-timestamped line (console + in-memory for attachment). */
export function e2eLog(testInfo: TestInfo, message: string): void {
  const line = `[${new Date().toISOString()}] ${message}`
  linesFor(testInfo).push(line)
  // eslint-disable-next-line no-console
  console.log(`[E2E isolation] ${message}`)
}

/** Attach accumulated isolation log and clear buffer (call from fixture teardown). */
export async function flushE2eIsolationLog(testInfo: TestInfo): Promise<void> {
  const lines = logLinesByTestId.get(testInfo.testId)
  if (!lines?.length) return
  await testInfo.attach('e2e-isolation-log.txt', {
    body: Buffer.from(lines.join('\n')),
    contentType: 'text/plain; charset=utf-8',
  })
  logLinesByTestId.delete(testInfo.testId)
}

/**
 * Globally unique suffix: wall clock + 8 hex chars (sub-ms collisions, parallel workers).
 */
export function e2eUniqueSuffix(shortTag = 't'): string {
  const hex = randomBytes(4).toString('hex').toUpperCase()
  return `${shortTag}-${Date.now()}-${hex}`
}

/** Unique catalog part number (ASCII, bounded length). Includes suite id for traceability. */
export function uniquePartNumber(tag: string): string {
  const suite = readSuiteRunId().replace(/[^A-Za-z0-9]/g, '').slice(0, 24) || 'RUN'
  const safe = tag.replace(/[^A-Za-z0-9]/g, '').slice(0, 12) || 'X'
  return `E2E-${suite}-${safe}-${e2eUniqueSuffix('pn')}`.slice(0, 120)
}

/** Display name: must start with `[E2E]` for tag-based purge / leak detection. */
export function uniqueProductName(tag: string): string {
  const suite = readSuiteRunId()
  const safe = tag.replace(/[^\w\s-]/g, '').slice(0, 24).trim() || 'Product'
  const ts = Date.now()
  const hex = randomBytes(3).toString('hex').toUpperCase()
  const core = `[E2E][${suite}][${ts}] ${safe} ${hex}`
  return core.slice(0, 200)
}

/** One bundle for a single test body (name + part number + run id for auxiliary entities). */
export function newE2EProductBundle(tag: string): { runId: string; partNumber: string; productName: string } {
  const suite = readSuiteRunId()
  const ts = Date.now()
  const runId = `${suite}-${ts}-${randomBytes(2).toString('hex')}`
  return {
    runId,
    partNumber: uniquePartNumber(tag),
    productName: uniqueProductName(tag),
  }
}
