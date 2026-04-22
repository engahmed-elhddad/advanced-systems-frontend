/**
 * Builds file-level before/after patches from reports/ai-analysis.json.
 * Reads spec sources under tests/ to anchor line numbers. Does NOT apply patches.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { classifyIssueKind, normalizeTestFile } from './generate-ai-fix-suggestions.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.resolve(__dirname, '..')
const ANALYSIS_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-analysis.json')
const OUTPUT_PATH = path.join(FRONTEND_ROOT, 'reports', 'ai-code-patches.json')

/**
 * @param {string} basename e.g. admin-login.spec.ts
 * @param {string} errorsJoined
 * @returns {number | null} 1-based line
 */
function extractStackLineForFile(basename, errorsJoined) {
  const re = new RegExp(
    `${basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:(\\d+):\\d+`,
    'g',
  )
  let m
  let best = null
  while ((m = re.exec(errorsJoined)) !== null) {
    const n = parseInt(m[1], 10)
    if (!Number.isNaN(n)) best = n
  }
  return best
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function extractQuotedLocatorsFromError(text) {
  const out = new Set()
  const patterns = [
    /getByTestId\(\s*['"]([^'"]+)['"]\s*\)/gi,
    /getByRole\(\s*['"]([^'"]+)['"]/gi,
    /getByLabel\(\s*['"]([^'"]+)['"]/gi,
    /locator\(\s*['"`]([^'"`]+)['"`]\s*\)/gi,
  ]
  for (const re of patterns) {
    let m
    const r = new RegExp(re.source, re.flags)
    while ((m = r.exec(text)) !== null) {
      if (m[1] && m[1].length < 200) out.add(m[1].trim())
    }
  }
  return [...out]
}

/**
 * @param {string[]} lines
 * @param {string} needle
 * @returns {number | null} 1-based
 */
function findLineContaining(lines, needle) {
  if (!needle) return null
  const n = needle.trim()
  if (!n) return null
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(n)) return i + 1
  }
  return null
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function hasExplicitExpectTimeout(line) {
  return /expect\s*\([^)]+\)\s*\.\s*\w+\s*\(\s*\{[^}]*\btimeout\s*:/.test(line)
}

/**
 * @param {string} line
 * @returns {string | null}
 */
function patchTimeoutLine(line) {
  if (hasExplicitExpectTimeout(line)) {
    if (/timeout:\s*60_000/.test(line)) {
      return line.replace(/timeout:\s*[\d_]+/, 'timeout: 90_000')
    }
    return line.replace(/timeout:\s*([\d_]+)/, () => 'timeout: 90_000')
  }
  if (/\.toBeVisible\s*\(\s*\)\s*;?/.test(line)) {
    return line.replace(/\.toBeVisible\s*\(\s*\)/, '.toBeVisible({ timeout: 60_000 })')
  }
  if (/\.toBeVisible\s*\(\s*\{\s*\}\s*\)/.test(line)) {
    return line.replace(/\.toBeVisible\s*\(\s*\{\s*\}\s*\)/, '.toBeVisible({ timeout: 60_000 })')
  }
  if (/\.toBeVisible\s*\(\s*\{/.test(line) && !/\btimeout\s*:/.test(line)) {
    return line.replace(/\.toBeVisible\s*\(\s*\{/, '.toBeVisible({ timeout: 60_000, ')
  }
  if (/\.toHaveURL\s*\(\s*[^)]+\)\s*;?/.test(line) && !/timeout/.test(line)) {
    return line.replace(
      /\.toHaveURL\s*\(\s*([^)]+)\s*\)/,
      '.toHaveURL($1, { timeout: 60_000 })',
    )
  }
  return null
}

/**
 * @param {string} line
 * @returns {string | null}
 */
function patchStrictDuplicateLine(line) {
  if (line.includes('.first()')) return null
  if (!/\.(click|fill|check|press|dblclick|tap)\s*\(/.test(line)) return null
  const patched = line.replace(/\)\s*\.(click|fill|check|press|dblclick|tap)\s*\(/, ').first().$1(')
  return patched !== line ? patched : null
}

/**
 * @param {string} line
 * @returns {{ after: string, confidence: 'medium' | 'low' } | null}
 */
function patchGetByTestIdLine(line) {
  if (!/getByTestId\s*\(/.test(line)) return null
  const idMatch = line.match(/getByTestId\(\s*['"]([^'"]+)['"]\s*\)/)
  if (!idMatch) return null
  const id = idMatch[1]
  const words = id.split(/[-_]/).filter(Boolean)
  const label = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  const after = line.replace(
    /getByTestId\(\s*['"][^'"]+['"]\s*\)/,
    `getByRole('button', { name: '${label || 'Label'}' })`,
  )
  return { after, confidence: 'low' }
}

/**
 * @param {string} line
 * @returns {string | null}
 */
function patchGotoLine(line) {
  if (!/page\.goto\s*\(/.test(line) || /\btimeout\s*:\s*[\d_]/.test(line)) return null
  const oneArg = line.replace(
    /page\.goto\s*\(\s*(['"`][^'"`]*['"`])\s*\)/,
    `page.goto($1, { waitUntil: 'domcontentloaded', timeout: 60_000 })`,
  )
  if (oneArg !== line) return oneArg
  const withOpts = line.replace(
    /page\.goto\s*\(\s*([^,]+)\s*,\s*\{([^}]*)\}\s*\)/,
    (all, url, inner) => {
      if (/\btimeout\s*:/.test(inner)) return all
      const trimmed = inner.trim().replace(/,\s*$/, '')
      return `page.goto(${url}, { ${trimmed}${trimmed ? ', ' : ''}timeout: 60_000 })`
    },
  )
  if (withOpts !== line) return withOpts
  return null
}

/**
 * @param {string} line
 * @returns {string | null}
 */
function patchWaitForUrlLine(line) {
  if (!/\.waitForURL\s*\(/.test(line) || /\btimeout\s*:\s*[\d_]/.test(line)) return null
  const idx = line.lastIndexOf(')')
  if (idx < 0) return null
  const beforeParen = line.slice(0, idx)
  const openIdx = beforeParen.indexOf('waitForURL(')
  if (openIdx < 0) return null
  const inside = beforeParen.slice(openIdx + 'waitForURL('.length)
  if (/\btimeout\s*:/.test(inside)) return null
  return `${line.slice(0, idx)}, { timeout: 90_000 })${line.slice(idx + 1)}`
}

/**
 * Insert `.first()` on the locator inside `expect(page.getBy…(…))` (balanced parens).
 * @param {string} line
 * @returns {string | null}
 */
function patchExpectLocatorFirst(line) {
  if (!/expect\s*\(\s*page\.(getBy|locator)/.test(line) || !/\.toBeVisible/.test(line)) return null
  if (line.includes('.first()')) return null
  const expectIdx = line.indexOf('expect(')
  if (expectIdx < 0) return null
  const pageIdx = line.indexOf('page.', expectIdx)
  if (pageIdx < 0) return null
  const open = line.indexOf('(', pageIdx + 4)
  if (open < 0) return null
  let depth = 0
  for (let k = open; k < line.length; k++) {
    const ch = line[k]
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0) {
        const endLoc = k + 1
        const rest = line.slice(endLoc)
        if (/^\)\s*\.\s*toBeVisible/.test(rest)) {
          return `${line.slice(0, endLoc)}.first()${line.slice(endLoc)}`
        }
        return null
      }
    }
  }
  return null
}

/**
 * @param {string} line
 * @param {'navigation' | 'timeout' | 'selector' | 'generic'} kind
 * @param {string} errorBlob
 * @returns {{ before: string, after: string, confidence: 'high' | 'medium' | 'low' } | null}
 */
function buildMinimalPatchForLine(line, kind, errorBlob) {
  const strictOrMulti =
    /strict\s*mode|resolved\s+to\s+\d+\s+elements?|more\s+than\s+one/i.test(errorBlob)

  if (kind === 'selector') {
    const testIdPatch = patchGetByTestIdLine(line)
    if (testIdPatch) {
      return {
        before: line,
        after: testIdPatch.after,
        confidence: testIdPatch.confidence,
      }
    }
    if (strictOrMulti) {
      const p = patchStrictDuplicateLine(line)
      if (p) {
        return { before: line, after: p, confidence: 'high' }
      }
      const ex = patchExpectLocatorFirst(line)
      if (ex) {
        return { before: line, after: ex, confidence: 'medium' }
      }
    }
  }

  if (kind === 'timeout') {
    const p = patchTimeoutLine(line)
    if (p && p !== line) {
      const c = hasExplicitExpectTimeout(line) ? 'medium' : 'high'
      return { before: line, after: p, confidence: c }
    }
  }

  if (kind === 'navigation') {
    if (/await\s+page\.goto\s*\(/.test(line)) {
      const g = patchGotoLine(line)
      if (g) return { before: line, after: g, confidence: 'medium' }
    }
    if (/\.waitForURL\s*\(/.test(line)) {
      const w = patchWaitForUrlLine(line)
      if (w) return { before: line, after: w, confidence: 'high' }
    }
  }

  return null
}

/**
 * @param {string[]} lines
 * @param {number} lineNum 1-based
 * @param {'navigation' | 'timeout' | 'selector' | 'generic'} kind
 * @param {string} errorBlob
 * @returns {{ line: number, before: string, after: string, confidence: 'high' | 'medium' | 'low' } | null}
 */
function patchFromResolvedLine(lines, lineNum, kind, errorBlob) {
  if (lineNum < 1 || lineNum > lines.length) return null
  const line = lines[lineNum - 1]
  const built = buildMinimalPatchForLine(line, kind, errorBlob)
  if (built) {
    return { line: lineNum, ...built }
  }
  return null
}

/**
 * Resolve best 1-based line for a failure.
 * @param {string[]} lines
 * @param {{ file?: string, line?: number, errors?: string[] }} failure
 * @param {string} errorsJoined
 * @returns {number | null}
 */
function resolveFailingLine(lines, failure, errorsJoined) {
  const base = failure.file ? path.basename(failure.file) : ''
  const fromStack = base ? extractStackLineForFile(base, errorsJoined) : null
  if (fromStack != null && fromStack >= 1 && fromStack <= lines.length) return fromStack

  const specLine = failure.line
  if (typeof specLine === 'number' && specLine > 0 && specLine <= lines.length) return specLine

  const hints = extractQuotedLocatorsFromError(errorsJoined)
  for (const h of hints) {
    const ln = findLineContaining(lines, `getByTestId('${h}')`) || findLineContaining(lines, `getByTestId("${h}")`)
    if (ln) return ln
  }
  for (const h of hints) {
    const ln = findLineContaining(lines, h)
    if (ln) return ln
  }

  return null
}

/**
 * @param {Record<string, unknown>} failure
 * @param {string} root
 * @returns {Promise<string | null>}
 */
async function readSpecSource(failure, root) {
  const rel = normalizeTestFile(failure.file ?? '')
  if (rel === '(unknown)') return null
  const full = path.join(root, rel)
  try {
    return await fs.readFile(full, 'utf8')
  } catch {
    try {
      const alt = path.join(root, failure.file ?? '')
      return await fs.readFile(alt, 'utf8')
    } catch {
      return null
    }
  }
}

/**
 * @param {Record<string, unknown>} analysisPayload
 * @param {string} frontendRoot
 */
export async function buildCodePatchesPayload(analysisPayload, frontendRoot = FRONTEND_ROOT) {
  const generatedAt = new Date().toISOString()
  const failures = Array.isArray(analysisPayload.failures) ? analysisPayload.failures : []

  /** @type {Array<{ file: string, line: number, before: string, after: string, confidence: string }>} */
  const patches = []

  for (const failure of failures) {
    const errorsJoined = [...(failure.errors ?? []), ...(failure.stderr ?? [])].join('\n')
    const rootCause = String(analysisPayload?.analysis?.rootCause ?? '')
    const suggestedFix = String(analysisPayload?.analysis?.suggestedFix ?? '')
    const blob = [errorsJoined, rootCause, suggestedFix].filter(Boolean).join('\n')
    const kind = classifyIssueKind(blob)

    const relFile = normalizeTestFile(failure.file ?? '')
    const source = await readSpecSource(failure, frontendRoot)

    if (!source) {
      patches.push({
        file: relFile,
        line: typeof failure.line === 'number' ? failure.line : 0,
        before: '(source file not read; patch is heuristic)',
        after: errorsJoined.slice(0, 400) || rootCause.slice(0, 400),
        confidence: 'low',
      })
      continue
    }

    const lines = source.split(/\r?\n/)
    let lineNum = resolveFailingLine(lines, failure, errorsJoined)

    if (lineNum == null) {
      patches.push({
        file: relFile,
        line: 0,
        before: '(could not map error to a line in file)',
        after: errorsJoined.slice(0, 500),
        confidence: 'low',
      })
      continue
    }

    let patch = patchFromResolvedLine(lines, lineNum, kind, errorsJoined)

    if (!patch && kind === 'selector') {
      for (let delta = -2; delta <= 2 && !patch; delta++) {
        const ln = lineNum + delta
        patch = patchFromResolvedLine(lines, ln, kind, errorsJoined)
        if (patch) lineNum = ln
      }
    }

    if (!patch && kind === 'timeout') {
      for (let delta = -3; delta <= 3 && !patch; delta++) {
        const ln = lineNum + delta
        const p = patchFromResolvedLine(lines, ln, kind, errorsJoined)
        if (p) {
          patch = p
          lineNum = ln
          break
        }
      }
    }

    if (!patch && kind === 'navigation') {
      for (let i = 0; i < lines.length; i++) {
        if (/await\s+page\.goto\s*\(/.test(lines[i])) {
          const p = buildMinimalPatchForLine(lines[i], kind, errorsJoined)
          if (p) {
            patch = { line: i + 1, ...p }
            lineNum = i + 1
            break
          }
        }
      }
      if (!patch) {
        for (let i = 0; i < lines.length; i++) {
          if (/waitForURL\s*\(/.test(lines[i])) {
            const p = buildMinimalPatchForLine(lines[i], kind, errorsJoined)
            if (p) {
              patch = { line: i + 1, ...p }
              break
            }
          }
        }
      }
    }

    if (patch) {
      patches.push({
        file: relFile,
        line: patch.line,
        before: patch.before,
        after: patch.after,
        confidence: patch.confidence,
      })
    } else {
      const line = lines[lineNum - 1] ?? ''
      patches.push({
        file: relFile,
        line: lineNum,
        before: line.slice(0, 500),
        after: `// No automatic minimal patch inferred (${kind}). ${suggestedFix.slice(0, 200)}`,
        confidence: 'low',
      })
    }
  }

  if (failures.length === 0) {
    const rootCause = String(analysisPayload?.analysis?.rootCause ?? '')
    patches.push({
      file: '(none)',
      line: 0,
      before: '(no failures in analysis)',
      after: rootCause || '(empty)',
      confidence: 'low',
    })
  }

  return {
    generatedAt,
    note: 'Patches are suggestions only; they are not applied automatically.',
    patches,
  }
}

/**
 * @param {{ generatedAt: string, note: string, patches: Array<{ file: string, line: number, before: string, after: string, confidence: string }> }} payload
 */
export function printCodePatchesToConsole(payload) {
  console.log('')
  console.log('── AI code patches (not applied) ──')
  console.log(`Generated: ${payload.generatedAt}`)
  console.log(payload.note)
  console.log('')
  let i = 1
  for (const p of payload.patches) {
    console.log(`[${i}] ${p.file}:${p.line}  confidence=${p.confidence}`)
    console.log('  --- before ---')
    console.log(indentBlock(String(p.before), '  '))
    console.log('  --- after ---')
    console.log(indentBlock(String(p.after), '  '))
    console.log('')
    i += 1
  }
  console.log('Written: reports/ai-code-patches.json')
  console.log('──────────────────────────────────')
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
 * @param {string} [frontendRoot]
 */
export async function writeCodePatchesReport(analysisPath, outputPath, frontendRoot = FRONTEND_ROOT) {
  const text = await fs.readFile(analysisPath, 'utf8')
  const analysisPayload = JSON.parse(text)
  const out = await buildCodePatchesPayload(analysisPayload, frontendRoot)
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(out, null, 2), 'utf8')
  return out
}

async function main() {
  try {
    const out = await writeCodePatchesReport(ANALYSIS_PATH, OUTPUT_PATH)
    printCodePatchesToConsole(out)
  } catch (e) {
    console.error(`[generate-ai-code-patches] ${e?.message ?? e}`)
    process.exitCode = 1
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  main()
}
