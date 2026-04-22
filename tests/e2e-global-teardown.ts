/**
 * Playwright globalTeardown — runs after all tests (pass or fail).
 * 1) Purge all `[E2E]`-tagged products (retrying deletes); fail if any remain.
 * 2) analyze-playwright-results.mjs → reports/ai-analysis.json
 * 3) ai-decision-engine.mjs → reports/ai-decisions.json + reports/ai-actions.json
 * 4) ai-execute-actions.mjs → retry once, or print test-side fixes
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import type { FullConfig } from '@playwright/test'
import { purgeAllTaggedE2eProductsAndAssertClean } from './e2e-cleanup'
import { loadE2eEnv } from './load-e2e-env'

export default async function globalTeardown(_config: FullConfig): Promise<void> {
  loadE2eEnv()
  try {
    await purgeAllTaggedE2eProductsAndAssertClean()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[e2e-global-teardown] tagged product purge / leak check failed:', e)
    process.exitCode = 1
  }

  const root = process.cwd()
  const scriptsDir = path.join(root, 'scripts')

  const r1 = spawnSync(process.execPath, [path.join(scriptsDir, 'analyze-playwright-results.mjs')], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  if (r1.status !== 0) {
    // eslint-disable-next-line no-console
    console.error('[e2e-global-teardown] analyze-playwright-results.mjs exited with', r1.status)
  }

  const r2 = spawnSync(process.execPath, [path.join(scriptsDir, 'ai-decision-engine.mjs')], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  if (r2.status !== 0) {
    // eslint-disable-next-line no-console
    console.error('[e2e-global-teardown] ai-decision-engine.mjs exited with', r2.status)
  }

  const r3 = spawnSync(process.execPath, [path.join(scriptsDir, 'ai-execute-actions.mjs')], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  if (r3.status !== 0 && r3.status !== null) {
    // eslint-disable-next-line no-console
    console.error('[e2e-global-teardown] ai-execute-actions.mjs exited with', r3.status)
    process.exitCode = r3.status
  }
}
