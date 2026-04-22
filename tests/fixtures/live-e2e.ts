/**
 * Shared live E2E fixture: console errors, failed requests, and HTTP >=400 on /api/.
 * Attach diagnostics on failure for human-readable CI/debug output.
 */
import { test as base, expect } from '@playwright/test'
import { flushE2eIsolationLog } from '../e2e-isolation'

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const consoleErrors: string[] = []
    const networkFailed: string[] = []
    const apiHttpErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[console] ${msg.text()}`)
    })

    page.on('requestfailed', (req) => {
      const f = req.failure()
      networkFailed.push(`${req.method()} ${req.url()} — ${f?.errorText ?? 'unknown failure'}`)
    })

    page.on('response', (res) => {
      const u = res.url()
      if (!u.includes('/api/')) return
      const st = res.status()
      if (st < 400) return
      apiHttpErrors.push(`${res.request().method()} ${u} → HTTP ${st}`)
    })

    await use(page)

    await flushE2eIsolationLog(testInfo)

    const st = testInfo.status
    if (st && !['passed', 'skipped'].includes(st)) {
      await testInfo.attach('console-errors.txt', {
        body: Buffer.from(consoleErrors.join('\n') || '(none)'),
        contentType: 'text/plain',
      })
      await testInfo.attach('network-failures.txt', {
        body: Buffer.from(networkFailed.join('\n') || '(none)'),
        contentType: 'text/plain',
      })
      await testInfo.attach('api-http-errors.txt', {
        body: Buffer.from(apiHttpErrors.join('\n---\n') || '(none)'),
        contentType: 'text/plain',
      })
    }
  },
})

export { expect }
