/**
 * Playwright globalTeardown — runs after all tests (pass or fail).
 * 1) analyze-playwright-results.mjs → reports/ai-analysis.json
 * 2) ai-decision-engine.mjs → reports/ai-decisions.json + reports/ai-actions.json
 * 3) ai-execute-actions.mjs → retry once, or print test-side fixes (never for product-class issues)
 */
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const analyzer = path.join(__dirname, 'analyze-playwright-results.mjs')
const decide = path.join(__dirname, 'ai-decision-engine.mjs')
const execute = path.join(__dirname, 'ai-execute-actions.mjs')

export default async function globalTeardown() {
  const r1 = spawnSync(process.execPath, [analyzer], { cwd: root, stdio: 'inherit', env: process.env })
  if (r1.status !== 0) {
    console.error('[e2e-global-teardown] analyze-playwright-results.mjs exited with', r1.status)
  }

  const r2 = spawnSync(process.execPath, [decide], { cwd: root, stdio: 'inherit', env: process.env })
  if (r2.status !== 0) {
    console.error('[e2e-global-teardown] ai-decision-engine.mjs exited with', r2.status)
  }

  const r3 = spawnSync(process.execPath, [execute], { cwd: root, stdio: 'inherit', env: process.env })
  if (r3.status !== 0 && r3.status !== null) {
    console.error('[e2e-global-teardown] ai-execute-actions.mjs exited with', r3.status)
    process.exitCode = r3.status
  }
}
