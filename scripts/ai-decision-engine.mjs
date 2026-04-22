/**
 * Decision engine: classifies failures (selector, timeout, network, assertion, navigation, unknown)
 * and chooses actions (fix-test, fix-product, retry, ignore, manual-review).
 *
 * Writes reports/ai-decisions.json and reports/ai-actions.json (legacy bridge for ai-execute-actions).
 *
 * Safeguards: product-side actions never trigger test patch generation (enforced via ai-actions mapping + executor).
 * Retry remains single-run via PLAYWRIGHT_AI_EXECUTE_RETRY_DONE in ai-execute-actions.mjs.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.resolve(__dirname, '..')
const ANALYSIS_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-analysis.json')
const DECISIONS_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-decisions.json')
const ACTIONS_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-actions.json')

/** @typedef {'selector' | 'timeout' | 'network' | 'assertion' | 'navigation' | 'unknown'} FailureType */
/** @typedef {'fix-test' | 'fix-product' | 'retry' | 'ignore' | 'manual-review'} DecisionAction */
/** @typedef {'high' | 'medium' | 'low'} Confidence */

/**
 * @param {string} blob
 * @returns {'redirect' | 'wait' | 'generic'}
 */
function navigationSubtype(blob) {
  const t = blob.toLowerCase()
  if (
    /unexpected\s+url|wrong\s+url|different\s+url|redirected\s+to|302|303|landed\s+on|expected\s+url/i.test(
      t,
    )
  ) {
    return 'redirect'
  }
  if (/waitforurl|navigation\s+timeout|waiting\s+for\s+navigation|goto.*timeout|commit\s+navigation/i.test(t)) {
    return 'wait'
  }
  return 'generic'
}

/**
 * @param {string} blob
 * @returns {FailureType}
 */
export function classifyFailureBlob(blob) {
  const t = blob.toLowerCase()

  if (
    /net::|econnrefused|err_name_not_resolved|err_connection|failed\s+to\s+fetch|proxy|502|503|504|connection\s+reset|dns|api\s+(error|failed)|network\s+error/i.test(
      t,
    )
  ) {
    return 'network'
  }

  if (
    /assertionerror|assertion\s+failed|expect\s*\([^)]*\)\.(not\.)?\w+|received:.*expected:|expected\s+.*\s+received|strict\s+equality|tobeclose|toequal|tomatchsnapshot/i.test(
      t,
    ) &&
    !/locator\.|waiting\s+for\s+locator|resolved\s+to\s+\d+\s+elements/i.test(t)
  ) {
    return 'assertion'
  }

  if (
    /locator|selector|strict\s+mode|getby|element\s+not\s+found|not\s+visible|not\s+attached|resolved\s+to\s+\d+\s+elements|element\(s\)\s+not\s+found/i.test(
      t,
    )
  ) {
    return 'selector'
  }

  if (/timeout|timed\s+out|timeouterror|exceeding\s+\d+ms|waiting\s+for.*\d+ms/i.test(t)) {
    return 'timeout'
  }

  if (/waitforurl|page\.goto|navigation|unexpected\s+url|tohaveurl|url\s+mismatch/i.test(t)) {
    return 'navigation'
  }

  return 'unknown'
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {boolean}
 */
function isFlakyContext(payload) {
  const flaky = payload.summary?.flaky ?? 0
  if (typeof flaky === 'number' && flaky > 0) return true
  const rc = String(payload.analysis?.rootCause ?? '').toLowerCase()
  const sf = String(payload.analysis?.suggestedFix ?? '').toLowerCase()
  return /\b(flaky|flakiness|flake|intermittent|unstable)\b/i.test(rc) || /\b(flaky|intermittent)\b/i.test(sf)
}

/**
 * @param {FailureType} type
 * @param {string} blob
 * @param {Record<string, unknown>} payload
 * @returns {{ action: DecisionAction, confidence: Confidence, reason: string }}
 */
function decideForType(type, blob, payload) {
  const flaky = isFlakyContext(payload)

  switch (type) {
    case 'selector':
      return {
        action: 'fix-test',
        confidence: 'high',
        reason:
          'Failure text matches locator/selector symptoms (strict mode, getBy*, visibility, or multiple matches). Test code should be updated; patches are test-side only.',
      }
    case 'timeout':
      if (flaky) {
        return {
          action: 'retry',
          confidence: 'medium',
          reason:
            'Timeout classified as potentially flaky (flaky counter or flaky wording in analysis). Single automated retry is allowed; if it persists, escalate to manual review.',
        }
      }
      return {
        action: 'manual-review',
        confidence: 'medium',
        reason:
          'Timeout appears consistent (no flaky signals). Requires human triage to distinguish slow environment vs wrong waits vs product slowness.',
      }
    case 'network':
      return {
        action: 'fix-product',
        confidence: 'high',
        reason:
          'Network/API/DNS or transport errors indicate backend, proxy, or service issues. Do not apply Playwright test patches automatically; investigate product and infrastructure.',
      }
    case 'assertion':
      return {
        action: 'fix-product',
        confidence: 'medium',
        reason:
          'Pure assertion mismatch often reflects application behavior vs outdated expectations. Treat as product/test contract review; automated test patches are not applied for this class.',
      }
    case 'navigation': {
      const sub = navigationSubtype(blob)
      if (sub === 'redirect') {
        return {
          action: 'manual-review',
          confidence: 'medium',
          reason:
            'Navigation failure looks like redirect/URL mismatch. Review auth flows, base URL, and server redirects before changing waits.',
        }
      }
      if (sub === 'wait') {
        return {
          action: 'fix-test',
          confidence: 'high',
          reason:
            'Navigation timing/wait issue (waitForURL/goto). Prefer explicit waits and load-state in the test; safe to suggest test-side patches only.',
        }
      }
      return {
        action: 'manual-review',
        confidence: 'low',
        reason:
          'Navigation-related failure without clear redirect vs wait signal; needs manual inspection of trace and URLs.',
      }
    }
    default:
      return {
        action: 'manual-review',
        confidence: 'low',
        reason:
          'Could not confidently classify failure from available messages. Review reports/html, traces, and ai-analysis.json.',
      }
  }
}

const ACTION_PRIORITY = /** @type {const} */ ({
  'fix-product': 0,
  'manual-review': 1,
  'fix-test': 2,
  retry: 3,
  ignore: 4,
})

/**
 * @param {DecisionEntry[]} decisions
 * @returns {DecisionEntry}
 */
function pickPrimaryDecision(decisions) {
  let best = decisions[0]
  let bestP = ACTION_PRIORITY[best.action]
  for (let i = 1; i < decisions.length; i++) {
    const p = ACTION_PRIORITY[decisions[i].action]
    if (p < bestP) {
      best = decisions[i]
      bestP = p
    }
  }
  return best
}

/**
 * @typedef {{ type: FailureType, action: DecisionAction, confidence: Confidence, reason: string }} DecisionEntry
 */

/**
 * @param {Record<string, unknown>} payload
 * @returns {{
 *   generatedAt: string,
 *   decisions: DecisionEntry[],
 *   primary: DecisionEntry,
 *   safeguards: { applyTestPatches: boolean, productIssue: boolean, retrySingleRun: boolean, note: string },
 *   legacyAction: { action: string, reason: string, nextStep: string, source: string }
 * }}
 */
export function computeDecisionsFromAnalysis(payload) {
  const generatedAt = new Date().toISOString()
  const failedCount = payload.summary?.failedCount ?? payload.failures?.length ?? 0

  if (failedCount === 0) {
    const single = {
      type: /** @type {FailureType} */ ('unknown'),
      action: /** @type {DecisionAction} */ ('ignore'),
      confidence: /** @type {Confidence} */ ('high'),
      reason: 'No failing tests in the Playwright report; nothing to triage.',
    }
    const safeguards = {
      applyTestPatches: false,
      productIssue: false,
      retrySingleRun: false,
      note: 'Safeguard: test patches and retry hooks apply only when failures exist and action allows.',
    }
    return {
      generatedAt,
      decisions: [single],
      primary: single,
      safeguards,
      legacyAction: legacyFromPrimary(single, safeguards),
    }
  }

  const failures = Array.isArray(payload.failures) ? payload.failures : []
  const rootCause = String(payload.analysis?.rootCause ?? '')
  const suggestedFix = String(payload.analysis?.suggestedFix ?? '')

  /** @type {DecisionEntry[]} */
  const decisions = []

  for (let fi = 0; fi < failures.length; fi++) {
    const f = failures[fi]
    const errors = (f.errors ?? []).join('\n')
    const stderr = (f.stderr ?? []).join('\n')
    const blob = [errors, stderr, rootCause, suggestedFix].filter(Boolean).join('\n')
    const type = classifyFailureBlob(blob)
    const { action, confidence, reason } = decideForType(type, blob, payload)
    const title = f.title ? ` [${f.title}]` : ''
    decisions.push({
      type,
      action,
      confidence,
      reason: `${reason}${title}`,
    })
  }

  if (decisions.length === 0) {
    const fallback = {
      type: /** @type {FailureType} */ ('unknown'),
      action: /** @type {DecisionAction} */ ('manual-review'),
      confidence: /** @type {Confidence} */ ('low'),
      reason: 'Failures reported in summary but failure list was empty; inspect results.json.',
    }
    const safeguards = {
      applyTestPatches: false,
      productIssue: false,
      retrySingleRun: false,
      note: 'Safeguard: ambiguous failure data.',
    }
    return {
      generatedAt,
      decisions: [fallback],
      primary: fallback,
      safeguards,
      legacyAction: legacyFromPrimary(fallback, safeguards),
    }
  }

  const primary = pickPrimaryDecision(decisions)
  const productIssue = decisions.some((d) => d.action === 'fix-product')
  const applyTestPatches = primary.action === 'fix-test' && !productIssue

  const safeguards = {
    applyTestPatches,
    productIssue,
    retrySingleRun: primary.action === 'retry',
    note:
      'Safeguards: never generate or apply automated test patches for fix-product; retry at most once (enforced in ai-execute-actions).',
  }

  return {
    generatedAt,
    decisions,
    primary,
    safeguards,
    legacyAction: legacyFromPrimary(primary, safeguards),
  }
}

/**
 * @param {DecisionEntry} primary
 * @param {{ applyTestPatches: boolean, productIssue: boolean }} safeguards
 */
function legacyFromPrimary(primary, safeguards) {
  let action = 'none'
  let nextStep = 'No automated follow-up.'

  switch (primary.action) {
    case 'fix-test':
      action = safeguards.productIssue ? 'manual-review' : 'fix-suggested'
      nextStep = safeguards.productIssue
        ? 'Product-class failure also present; review ai-decisions.json before editing tests.'
        : 'Generate test-side fix suggestions and patches; do not change production without review.'
      break
    case 'fix-product':
      action = 'fix-product'
      nextStep = 'Investigate APIs, backend, and environment; do not apply Playwright patch automation.'
      break
    case 'retry':
      action = 'retry'
      nextStep = 'Re-run E2E once via executor guard; capture trace if still failing.'
      break
    case 'ignore':
      action = 'none'
      nextStep = 'No failures to act on.'
      break
    case 'manual-review':
      action = 'manual-review'
      nextStep = 'Open HTML report and traces; confirm classification before changing tests or product.'
      break
    default:
      action = 'none'
  }

  return {
    action,
    reason: `[${primary.type} → ${primary.action}] ${primary.reason}`,
    nextStep,
    source: 'ai-decision-engine',
  }
}

/**
 * Backward-compatible single object for older callers (replaces former ai-decide-actions output shape).
 * @param {Record<string, unknown>} payload
 */
export function decideFromAnalysisPayload(payload) {
  const { legacyAction } = computeDecisionsFromAnalysis(payload)
  return legacyAction
}

/**
 * @param {Record<string, unknown>} payload
 */
export function buildDecisionsDocument(payload) {
  return computeDecisionsFromAnalysis(payload)
}

export function logDecisions(computed) {
  console.log('[ai-decision-engine] --- decisions ---')
  let i = 1
  for (const d of computed.decisions) {
    console.log(
      `[ai-decision-engine] #${i} type=${d.type} action=${d.action} confidence=${d.confidence}`,
    )
    console.log(`[ai-decision-engine]     reason: ${d.reason}`)
    i++
  }
  console.log(
    `[ai-decision-engine] primary: type=${computed.primary.type} action=${computed.primary.action} confidence=${computed.primary.confidence}`,
  )
  console.log(`[ai-decision-engine]     reason: ${computed.primary.reason}`)
  console.log(
    `[ai-decision-engine] safeguards: applyTestPatches=${computed.safeguards.applyTestPatches} productIssue=${computed.safeguards.productIssue}`,
  )
  console.log(`[ai-decision-engine] legacy ai-actions: action=${computed.legacyAction.action}`)
}

async function main() {
  let payload
  try {
    const text = await fs.readFile(ANALYSIS_PATH, 'utf8')
    payload = JSON.parse(text)
  } catch (e) {
    const errEntry = {
      type: /** @type {FailureType} */ ('unknown'),
      action: /** @type {DecisionAction} */ ('manual-review'),
      confidence: /** @type {Confidence} */ ('low'),
      reason: `Cannot read analysis: ${e?.message ?? e}`,
    }
    const errDoc = {
      generatedAt: new Date().toISOString(),
      decisions: [errEntry],
      primary: errEntry,
      safeguards: {
        applyTestPatches: false,
        productIssue: false,
        retrySingleRun: false,
        note: 'Analysis missing; no automated actions.',
      },
      legacyAction: {
        action: 'none',
        reason: String(e?.message ?? e),
        nextStep: 'Run Playwright E2E so analyze-playwright-results.mjs runs first.',
        source: 'ai-decision-engine',
      },
    }
    await fs.mkdir(path.dirname(DECISIONS_PATH), { recursive: true })
    await fs.writeFile(DECISIONS_PATH, JSON.stringify(errDoc, null, 2), 'utf8')
    await fs.writeFile(ACTIONS_PATH, JSON.stringify(errDoc.legacyAction, null, 2), 'utf8')
    console.error(errDoc.decisions[0].reason)
    process.exitCode = 1
    return
  }

  const computed = computeDecisionsFromAnalysis(payload)

  await fs.mkdir(path.dirname(DECISIONS_PATH), { recursive: true })
  await fs.writeFile(
    DECISIONS_PATH,
    JSON.stringify(
      {
        generatedAt: computed.generatedAt,
        decisions: computed.decisions,
        primary: computed.primary,
        safeguards: computed.safeguards,
      },
      null,
      2,
    ),
    'utf8',
  )
  await fs.writeFile(ACTIONS_PATH, JSON.stringify(computed.legacyAction, null, 2), 'utf8')

  console.log(`Wrote ${path.relative(FRONTEND_ROOT, DECISIONS_PATH)}`)
  console.log(`Wrote ${path.relative(FRONTEND_ROOT, ACTIONS_PATH)}`)
  logDecisions(computed)
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
