import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { adminNavSections } from './admin-navigation'

const FRONTEND_ROOT = path.resolve(__dirname, '../..')
const SRC_ROOT = path.join(FRONTEND_ROOT, 'src')
const DELETED_ADMIN_ROUTES = ['/admin/stock', '/admin/bulk-import', '/admin/upload-images']

function walkFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '.next' || entry.name === 'node_modules') return []
      return walkFiles(fullPath)
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) return []
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) return []
    return [fullPath]
  })
}

describe('admin stabilization guards', () => {
  it('does not reintroduce browser-visible admin API key helpers', () => {
    const offenders = walkFiles(SRC_ROOT).filter((file) => {
      const content = fs.readFileSync(file, 'utf8')
      return (
        content.includes('getBrowserAdminApiKey') ||
        content.includes('admin-api-key') ||
        content.includes('process.env.NEXT_PUBLIC_ADMIN_API_KEY')
      )
    })

    expect(offenders).toEqual([])
  })

  it('does not link admin navigation to deleted zombie pages', () => {
    const hrefs = adminNavSections.flatMap((section) => section.links.map((link) => link.href))

    for (const deletedRoute of DELETED_ADMIN_ROUTES) {
      expect(hrefs).not.toContain(deletedRoute)
    }
  })
})
