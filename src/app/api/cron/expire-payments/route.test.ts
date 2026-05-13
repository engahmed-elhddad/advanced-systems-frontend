import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

const OLD_ENV = process.env

afterEach(() => {
  process.env = OLD_ENV
  vi.unstubAllGlobals()
})

function request(secret?: string) {
  return new NextRequest('http://localhost/api/cron/expire-payments', {
    headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
  })
}

describe('/api/cron/expire-payments', () => {
  it('rejects requests without the cron bearer', async () => {
    process.env = { ...OLD_ENV, CRON_SECRET: 'cron-secret' }
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(request())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards cron bearer to backend expire-stale endpoint', async () => {
    process.env = { ...OLD_ENV, CRON_SECRET: 'cron-secret' }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ expired_count: 2, attempt_ids: [10, 11] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(request('cron-secret'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'success',
      expired_count: 2,
      attempt_ids: [10, 11],
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/internal/payments/expire-stale')
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ Authorization: 'Bearer cron-secret' })
  })
})
