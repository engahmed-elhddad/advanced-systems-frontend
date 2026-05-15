import { describe, expect, it } from 'vitest'
import vercelConfig from '../../vercel.json'

describe('vercel cron config', () => {
  it('keeps only payment reconciliation on the Vercel scheduler', () => {
    const crons = vercelConfig.crons ?? []

    expect(crons).toContainEqual({
      path: '/api/cron/reconcile-payments',
      schedule: '0 2 * * *',
    })
    expect(crons.find((entry) => entry.path === '/api/cron/expire-payments')).toBeUndefined()
    expect(crons.find((entry) => entry.path === '/api/cron/search-consistency')).toBeUndefined()
    expect(crons.find((entry) => entry.path === '/api/cron/sitemap-refresh')).toBeUndefined()
  })
})
