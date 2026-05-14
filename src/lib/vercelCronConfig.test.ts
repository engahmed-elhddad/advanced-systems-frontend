import { describe, expect, it } from 'vitest'
import vercelConfig from '../../vercel.json'

describe('vercel cron config', () => {
  it('schedules payment expiry, reconciliation, and search consistency checks', () => {
    const crons = vercelConfig.crons ?? []

    expect(crons).toContainEqual({
      path: '/api/cron/expire-payments',
      schedule: '30 1 * * *',
    })
    expect(crons).toContainEqual({
      path: '/api/cron/reconcile-payments',
      schedule: '0 2 * * *',
    })
    expect(crons).toContainEqual({
      path: '/api/cron/search-consistency',
      schedule: '30 2 * * *',
    })
  })
})
