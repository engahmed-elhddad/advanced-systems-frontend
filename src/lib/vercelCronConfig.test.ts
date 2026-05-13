import { describe, expect, it } from 'vitest'
import vercelConfig from '../../vercel.json'

describe('vercel cron config', () => {
  it('schedules payment expiry safety sweep and reconciliation', () => {
    const crons = vercelConfig.crons ?? []

    expect(crons).toContainEqual({
      path: '/api/cron/expire-payments',
      schedule: '30 1 * * *',
    })
    expect(crons).toContainEqual({
      path: '/api/cron/reconcile-payments',
      schedule: '0 2 * * *',
    })
  })
})
