/**
 * Executes AI decisions from reports/ai-actions.json (written by ai-decision-engine.mjs).
 * When action is fix-suggested, may write ai-fix-suggestions.json + ai-code-patches.json
 * only if ai-decisions.json safeguards allow test patches (never for fix-product).
 *
 * Loop guard: PLAYWRIGHT_AI_EXECUTE_RETRY_DONE=1 means a retry was already spawned;
 * a second "retry" decision does not run Playwright again.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { printFixSuggestionsToConsole, writeFixSuggestionsReport } from './generate-ai-fix-suggestions.mjs'
import { printCodePatchesToConsole, writeCodePatchesReport } from './generate-ai-code-patches.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.resolve(__dirname, '..')
const ACTIONS_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-actions.json')
const DECISIONS_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-decisions.json')
const ANALYSIS_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-analysis.json')
const FIX_SUGGESTIONS_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-fix-suggestions.json')
const CODE_PATCHES_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-code-patches.json')

const RETRY_GUARD = 'PLAYWRIGHT_AI_EXECUTE_RETRY_DONE'

async function main() {
  let actions
  try {
    const text = await fs.readFile(ACTIONS_PATH, 'utf8')
    actions = JSON.parse(text)
  } catch (e) {
    console.warn(`[ai-execute-actions] Skipping: cannot read ${ACTIONS_PATH}: ${e?.message ?? e}`)
    process.exit(0)
    return
  }

  const action = String(actions.action ?? 'none')

  if (action === 'none') {
    return
  }

  if (action === 'infra-issue') {
    console.log('Infra issue detected — skipping retry')
    process.exit(2)
    return
  }

  if (action === 'fix-product') {
    console.log('[ai-execute-actions] Product/API class issue — safeguard: skipping automated test patches and retry.')
    console.log(`[ai-execute-actions] Reason from ai-actions: ${actions.reason ?? '(none)'}`)
    return
  }

  if (action === 'manual-review') {
    console.log('[ai-execute-actions] Manual review required — safeguard: no automated patch apply or retry.')
    console.log(`[ai-execute-actions] Reason: ${actions.reason ?? '(none)'}`)
    return
  }

  if (action === 'fix-suggested') {
    const sg = await readSafeguardsFromDecisions()
    if (sg && sg.applyTestPatches === false) {
      console.log(
        '[ai-execute-actions] Safeguard: ai-decisions.json disallows test patches (e.g. product-class failure present). Skipping patch generation.',
      )
      return
    }
    console.log('AI suggests code fix (test-side)')
    try {
      const out = await writeFixSuggestionsReport(ANALYSIS_PATH, FIX_SUGGESTIONS_PATH)
      printFixSuggestionsToConsole(out)
      const patches = await writeCodePatchesReport(ANALYSIS_PATH, CODE_PATCHES_PATH)
      printCodePatchesToConsole(patches)
    } catch (e) {
      console.error(`[ai-execute-actions] Could not generate fix suggestions / patches: ${e?.message ?? e}`)
      process.exitCode = 1
    }
    return
  }

  if (action === 'retry') {
    if (process.env[RETRY_GUARD] === '1') {
      console.log('Skipping second AI-driven retry (single retry limit; avoids infinite loop).')
      process.exit(0)
      return
    }
    console.log('Retrying test due to AI decision')
    const playwrightCli = path.join(FRONTEND_ROOT, 'node_modules', '@playwright', 'test', 'cli.js')
    const r = spawnSync(process.execPath, [playwrightCli, 'test', '-c', 'playwright.e2e.config.ts'], {
      cwd: FRONTEND_ROOT,
      stdio: 'inherit',
      env: { ...process.env, [RETRY_GUARD]: '1' },
    })
    const code = r.status === null ? 1 : r.status
    process.exit(code)
    return
  }

  console.warn(`[ai-execute-actions] Unknown action: ${action}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
