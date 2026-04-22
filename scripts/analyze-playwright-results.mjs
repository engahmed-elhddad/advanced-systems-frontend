/**
 * Reads Playwright JSON report + attachment files under reports/,
 * optionally calls OpenAI, writes reports/ai-analysis.json
 *
 * Env: OPENAI_API_KEY (optional), OPENAI_MODEL (default gpt-4o-mini)
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.resolve(__dirname, '..')
const REPORTS = path.join(FRONTEND_ROOT, 'reports')
const RESULTS_JSON = path.join(REPORTS, 'results.json')
const OUTPUT = path.join(REPORTS, 'ai-analysis.json')

dotenv.config({ path: path.join(FRONTEND_ROOT, '.env.local') })
dotenv.config({ path: path.join(FRONTEND_ROOT, '.env') })

function collectFailedSpecs(suite, prefixTitles, out) {
  const here = suite.title ? [...prefixTitles, suite.title] : [...prefixTitles]

  for (const child of suite.suites ?? []) {
    collectFailedSpecs(child, here, out)
  }

  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      for (const result of test.results ?? []) {
        if (!['failed', 'timedOut', 'interrupted'].includes(result.status)) continue

        const title = [...here, spec.title].filter(Boolean).join(' › ')
        const errors = (result.errors ?? []).map((e) => (typeof e === 'string' ? e : e.message ?? JSON.stringify(e)))
        out.push({
          title,
          file: spec.file ?? suite.file,
          line: spec.line,
          status: result.status,
          durationMs: result.duration,
          errors,
          stderr: (result.stderr ?? []).map((s) => (typeof s === 'string' ? s : s.text ?? '')),
          stdout: (result.stdout ?? []).map((s) => (typeof s === 'string' ? s : s.text ?? '')),
          attachments: result.attachments ?? [],
        })
      }
    }
  }
}

async function readAttachmentBodies(attachments) {
  const parts = []
  for (const a of attachments) {
    const p = a.path
    if (!p) continue
    const name = a.name ?? path.basename(p)
    try {
      const text = await fs.readFile(p, 'utf8')
      parts.push({ name, contentType: a.contentType, text: text.slice(0, 120_000) })
    } catch {
      parts.push({ name, contentType: a.contentType, text: '(unreadable)' })
    }
  }
  return parts
}

async function fallbackAttachmentsFromTestResultsDir(testResultsDir) {
  const out = { consoleErrors: '', networkFailures: '' }
  try {
    const entries = await fs.readdir(testResultsDir, { withFileTypes: true })
    for (const e of entries) {
      if (!e.isDirectory()) continue
      const base = path.join(testResultsDir, e.name, 'attachments')
      try {
        const files = await fs.readdir(base)
        for (const f of files) {
          const full = path.join(base, f)
          if (f.includes('console-errors')) {
            out.consoleErrors += (await fs.readFile(full, 'utf8')) + '\n'
          }
          if (f.includes('network-failures')) {
            out.networkFailures += (await fs.readFile(full, 'utf8')) + '\n'
          }
        }
      } catch {
        /* no attachments dir */
      }
    }
  } catch {
    /* no test-results */
  }
  return out
}

async function callOpenAi(payload) {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) return null

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  const body = {
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a QA automation engineer. Reply with a single JSON object only (no markdown) with keys: rootCause (string), severity (one of: critical, high, medium, low), suggestedFix (string). Base conclusions only on the provided test failure data.',
      },
      {
        role: 'user',
        content: JSON.stringify(payload).slice(0, 200_000),
      },
    ],
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 2000)}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenAI returned empty content')
  return JSON.parse(text)
}

async function main() {
  const generatedAt = new Date().toISOString()
  let resultsRaw = null
  try {
    resultsRaw = JSON.parse(await fs.readFile(RESULTS_JSON, 'utf8'))
  } catch (e) {
    const payload = {
      generatedAt,
      error: `Could not read ${path.relative(FRONTEND_ROOT, RESULTS_JSON)}: ${e?.message ?? e}`,
      analysis: null,
    }
    await fs.mkdir(REPORTS, { recursive: true })
    await fs.writeFile(OUTPUT, JSON.stringify(payload, null, 2), 'utf8')
    console.error(payload.error)
    process.exitCode = 1
    return
  }

  const failed = []
  for (const suite of resultsRaw.suites ?? []) {
    collectFailedSpecs(suite, [], failed)
  }

  const enriched = []
  for (const f of failed) {
    const bodies = await readAttachmentBodies(f.attachments)
    enriched.push({
      ...f,
      attachmentBodies: bodies,
    })
  }

  const fallback = await fallbackAttachmentsFromTestResultsDir(path.join(REPORTS, 'test-results'))
  if ((fallback.consoleErrors || fallback.networkFailures) && enriched.length) {
    enriched[enriched.length - 1].fallbackConsoleFromDisk = fallback.consoleErrors.trim() || undefined
    enriched[enriched.length - 1].fallbackNetworkFromDisk = fallback.networkFailures.trim() || undefined
  }

  const stats = resultsRaw.stats ?? {}
  const summary = {
    expected: stats.expected ?? 0,
    skipped: stats.skipped ?? 0,
    unexpected: stats.unexpected ?? 0,
    flaky: stats.flaky ?? 0,
    durationMs: stats.duration ?? null,
    failedCount: failed.length,
  }

  let analysis = null
  let openaiError = null

  if (failed.length === 0) {
    analysis = {
      rootCause: 'No failing tests in this run.',
      severity: 'low',
      suggestedFix: 'None — all reported tests passed.',
    }
  } else {
    try {
      const apiResult = await callOpenAi({
        summary,
        failures: enriched.map(({ title, file, line, status, durationMs, errors, stderr, stdout, attachmentBodies, fallbackConsoleFromDisk, fallbackNetworkFromDisk }) => ({
          title,
          file,
          line,
          status,
          durationMs,
          errors,
          stderr,
          stdout,
          attachmentBodies,
          fallbackConsoleFromDisk,
          fallbackNetworkFromDisk,
        })),
      })
      if (apiResult) {
        analysis = {
          rootCause: apiResult.rootCause ?? '',
          severity: apiResult.severity ?? 'medium',
          suggestedFix: apiResult.suggestedFix ?? '',
        }
      } else {
        analysis = null
        openaiError = 'OPENAI_API_KEY not set; skipped AI analysis. Set OPENAI_API_KEY in .env.local to enable.'
      }
    } catch (e) {
      openaiError = e?.message ?? String(e)
      analysis = null
    }
  }

  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim())
  const out = {
    generatedAt,
    summary,
    failures: enriched,
    analysis,
    openaiSkipped: failed.length > 0 && !hasKey,
    openaiUsed: failed.length > 0 && hasKey && Boolean(analysis) && !openaiError,
    openaiError,
  }

  await fs.mkdir(REPORTS, { recursive: true })
  await fs.writeFile(OUTPUT, JSON.stringify(out, null, 2), 'utf8')
  console.log(`Wrote ${path.relative(FRONTEND_ROOT, OUTPUT)}`)

  if (failed.length > 0 && !analysis && openaiError) {
    console.error(openaiError)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
