/**
 * Builds actionable Playwright code hints from reports/ai-analysis.json.
 * Uses rootCause, suggestedFix, and per-failure errors (selector / timeout / navigation heuristics).
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.resolve(__dirname, '..')
const ANALYSIS_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-analysis.json')
const OUTPUT_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-fix-suggestions.json')

/**
 * @param {string} file
 * @returns {string}
 */
export function normalizeTestFile(file) {
  if (!file || typeof file !== 'string') return '(unknown)'
  const f = file.replace(/\\/g, '/')
  if (f.includes('tests/') || f.startsWith('tests/')) return f
  return `tests/${f}`
}

/**
 * @param {string} blob
 * @returns {'selector' | 'timeout' | 'navigation' | 'generic'}
 */
export function classifyIssueKind(blob) {
  const t = blob.toLowerCase()
  if (
    /waitforurl|wait for url|page\.goto|navigation|net::err|load failed|unexpected\s+url|expected\s+url/i.test(
      t,
    )
  ) {
    return 'navigation'
  }
  if (/timeout|timed out|timeout\s+\d+ms|exceeding|timeouterror/i.test(t)) {
    return 'timeout'
  }
  if (
    /locator|selector|strict mode|resolved to \d+ elements|not visible|not attached|not found|getbyrole|getbytext|getbytestid|element\(s\) not found/i.test(
      t,
    )
  ) {
    return 'selector'
  }
  return 'generic'
}

/**
 * @param {{ title?: string, file?: string, line?: number, errors?: string[], stderr?: string[], status?: string }} failure
 * @param {string} rootCause
 * @param {string} suggestedFix
 * @returns {{ file: string, issue: string, suggestedCode: string, explanation: string }}
 */
export function buildSuggestionForFailure(failure, rootCause, suggestedFix) {
  const errors = (failure.errors ?? []).join('\n')
  const stderr = (failure.stderr ?? []).join('\n')
  const blob = [errors, stderr, rootCause, suggestedFix].filter(Boolean).join('\n')
  const kind = classifyIssueKind(blob)
  const title = failure.title ?? 'unknown test'
  const file = normalizeTestFile(failure.file)
  const loc = failure.line != null ? `:${failure.line}` : ''

  switch (kind) {
    case 'selector': {
      return {
        file: `${file}${loc}`,
        issue: `Locator/selector issue in "${title}" — ${errors.slice(0, 160) || rootCause.slice(0, 160)}`,
        suggestedCode: `// Prefer stable, unique locators (role + name or data-testid):\nawait page.getByRole('button', { name: 'Exact label' }).click();\n// or\nawait page.getByTestId('submit-form').click();\n// If multiple matches, narrow: .filter({ hasText: '…' }).first()`,
        explanation:
          'Tighten the locator (getByRole/getByTestId), avoid brittle CSS, or use .first() only after confirming duplicates are acceptable.',
      }
    }
    case 'timeout': {
      return {
        file: `${file}${loc}`,
        issue: `Timeout while waiting in "${title}" — ${errors.slice(0, 160) || rootCause.slice(0, 160)}`,
        suggestedCode: `await expect(page.getByRole('heading', { name: 'Ready' })).toBeVisible({ timeout: 60_000 });\n// Slow network / CI: bump per-expect or suite:\n// test.describe.configure({ timeout: 120_000 });\n// Optional: await page.waitForLoadState('networkidle');`,
        explanation:
          'Increase explicit timeouts on slow expectations, or wait for load/network before asserting UI that appears after async work.',
      }
    }
    case 'navigation': {
      return {
        file: `${file}${loc}`,
        issue: `Navigation / URL timing in "${title}" — ${errors.slice(0, 160) || rootCause.slice(0, 160)}`,
        suggestedCode: `await page.goto('/path');\nawait page.waitForURL('**/admin/dashboard**');\nawait page.waitForLoadState('domcontentloaded');\n// Then assert page content.`,
        explanation:
          'Assert only after navigation completes: waitForURL (regex or string), then waitForLoadState, then locators.',
      }
    }
    default: {
      return {
        file: `${file}${loc}`,
        issue: `Test failure in "${title}" — ${rootCause.slice(0, 200)}`,
        suggestedCode: `// Stabilize the failing step using explicit waits and robust locators:\nawait expect(page.locator('main')).toBeVisible();\n// Re-run with trace: npx playwright test --trace on`,
        explanation: suggestedFix || rootCause || 'Review HTML report and traces; align assertions with actual app behavior.',
      }
    }
  }
}

/**
 * @param {Record<string, unknown>} analysisPayload - contents of ai-analysis.json
 * @returns {{ generatedAt: string, rootCause: string, suggestedFix: string, primary: { file: string, issue: string, suggestedCode: string, explanation: string } | null, suggestions: Array<{ file: string, issue: string, suggestedCode: string, explanation: string }> }}
 */
export function buildFixSuggestionsPayload(analysisPayload) {
  const generatedAt = new Date().toISOString()
  const rootCause = String(analysisPayload?.analysis?.rootCause ?? '')
  const suggestedFix = String(analysisPayload?.analysis?.suggestedFix ?? '')
  const failures = Array.isArray(analysisPayload.failures) ? analysisPayload.failures : []

  /** @type {Array<{ file: string, issue: string, suggestedCode: string, explanation: string }>} */
  const suggestions = []

  if (failures.length === 0) {
    suggestions.push({
      file: '(no failing test rows in ai-analysis.json)',
      issue: rootCause || 'No failure details; see analysis only.',
      suggestedCode: `// Apply the analysis suggestedFix in the most relevant spec under tests/:\n// ${suggestedFix.slice(0, 500)}`,
      explanation: suggestedFix || rootCause || 'Open reports/html and traces to locate the spec to edit.',
    })
  } else {
    for (const f of failures) {
      suggestions.push(buildSuggestionForFailure(f, rootCause, suggestedFix))
    }
  }

  const primary = suggestions[0] ?? null

  return {
    generatedAt,
    rootCause,
    suggestedFix,
    /** First failing test (or fallback); same shape as each entry in `suggestions`. */
    primary,
    suggestions,
  }
}

/**
 * @param {{ generatedAt: string, rootCause: string, suggestedFix: string, suggestions: Array<unknown> }} payload
 */
export function printFixSuggestionsToConsole(payload) {
  console.log('')
  console.log('── AI fix suggestions ──')
  console.log(`Generated: ${payload.generatedAt}`)
  console.log(`Root cause (analysis): ${payload.rootCause}`)
  console.log(`Suggested fix (analysis): ${payload.suggestedFix}`)
  console.log('')
  let i = 1
  for (const s of payload.suggestions) {
    console.log(`[${i}] File: ${s.file}`)
    console.log(`    Issue: ${s.issue}`)
    console.log(`    Suggested code:\n${indentBlock(String(s.suggestedCode), '    ')}`)
    console.log(`    Explanation: ${s.explanation}`)
    console.log('')
    i += 1
  }
  console.log(`Written: reports/ai-fix-suggestions.json`)
  console.log('────────────────────────')
}

function indentBlock(text, prefix) {
  return text
    .split('\n')
    .map((line) => prefix + line)
    .join('\n')
}

/**
 * @param {string} analysisPath
 * @param {string} outputPath
 */
export async function writeFixSuggestionsReport(analysisPath, outputPath) {
  const text = await fs.readFile(analysisPath, 'utf8')
  const analysisPayload = JSON.parse(text)
  const out = buildFixSuggestionsPayload(analysisPayload)
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(out, null, 2), 'utf8')
  return out
}

async function main() {
  let out
  try {
    out = await writeFixSuggestionsReport(ANALYSIS_PATH, OUTPUT_PATH)
  } catch (e) {
    console.error(`[generate-ai-fix-suggestions] ${e?.message ?? e}`)
    process.exitCode = 1
    return
  }
  printFixSuggestionsToConsole(out)
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  main()
}
