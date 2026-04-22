/**
 * @deprecated Prefer scripts/ai-decision-engine.mjs — this file delegates for npm script compatibility.
 */
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

export {
  buildDecisionsDocument,
  computeDecisionsFromAnalysis,
  decideFromAnalysisPayload,
  logDecisions,
} from './ai-decision-engine.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const engine = path.join(__dirname, 'ai-decision-engine.mjs')

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  const r = spawnSync(process.execPath, [engine], { cwd: root, stdio: 'inherit', env: process.env })
  process.exit(r.status === null ? 1 : r.status)
}
