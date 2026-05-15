import { describe, expect, it, vi } from 'vitest'

import { runPaymentExpiryCron } from '../../../railway-functions/payment-expiry-cron'
import { runSearchConsistencyCron } from '../../../railway-functions/search-consistency-cron'
import { runSitemapRefreshCron } from '../../../railway-functions/sitemap-refresh-cron'

type FakeResponse = {
  ok: boolean
  status: number
  text: () => Promise<string>
}

function jsonResponse(status: number, payload: unknown): FakeResponse {
  const text = JSON.stringify(payload)
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
  }
}

describe('Railway cron functions', () => {
  it('retries payment expiry on transient upstream failure and forwards the cron secret', async () => {
    const fetchMock = vi
      .fn<(...args: [string, RequestInit | undefined]) => Promise<FakeResponse>>()
      .mockResolvedValueOnce(jsonResponse(502, { error: 'upstream restarting' }))
      .mockResolvedValueOnce(jsonResponse(200, { expired_count: 2, attempt_ids: [41, 42] }))
    const sleepMock = vi.fn(async () => undefined)
    const logs: string[] = []

    const result = await runPaymentExpiryCron({
      env: {
        BACKEND_URL: 'https://api.example.com',
        CRON_SECRET: 'cron-secret',
      },
      fetchImpl: fetchMock,
      sleep: sleepMock,
      log: (line) => logs.push(line),
      now: () => new Date('2026-05-15T12:00:00.000Z'),
    })

    expect(result.attempts).toBe(2)
    expect(result.responseStatus).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.example.com/api/v1/internal/payments/expire-stale')
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer cron-secret',
      'Content-Type': 'application/json',
      'User-Agent': 'AdvancedSystems-RailwayCron/payment-expiry',
    })
    expect(sleepMock).toHaveBeenCalledTimes(1)
    expect(logs.some((line) => line.includes('"event":"cron_retry_scheduled"'))).toBe(true)
    expect(logs.some((line) => line.includes('"event":"cron_run_succeeded"'))).toBe(true)
  })

  it('does not retry search consistency when the backend reports real divergence', async () => {
    const fetchMock = vi
      .fn<(...args: [string, RequestInit | undefined]) => Promise<FakeResponse>>()
      .mockResolvedValueOnce(
        jsonResponse(503, {
          consistent: false,
          missing_in_meili_count: 1,
          orphaned_in_meili_count: 0,
        }),
      )
    const sleepMock = vi.fn(async () => undefined)

    await expect(
      runSearchConsistencyCron({
        env: {
          BACKEND_URL: 'https://api.example.com',
          CRON_SECRET: 'cron-secret',
        },
        fetchImpl: fetchMock,
        sleep: sleepMock,
        log: () => undefined,
        now: () => new Date('2026-05-15T12:00:00.000Z'),
      }),
    ).rejects.toThrow(/non-retryable/i)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(sleepMock).not.toHaveBeenCalled()
  })

  it('fails fast when sitemap refresh secrets are missing', async () => {
    const fetchMock = vi.fn()

    await expect(
      runSitemapRefreshCron({
        env: {
          FRONTEND_URL: 'https://www.example.com',
        },
        fetchImpl: fetchMock,
        sleep: async () => undefined,
        log: () => undefined,
        now: () => new Date('2026-05-15T12:00:00.000Z'),
      }),
    ).rejects.toThrow(/CRON_SECRET/i)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
