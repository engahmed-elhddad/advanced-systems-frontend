import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

const OLD_ENV = process.env

afterEach(() => {
  process.env = OLD_ENV
  vi.unstubAllGlobals()
})

function request(secret?: string) {
  return new NextRequest('http://localhost/api/cron/reconcile-payments', {
    headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
  })
}

describe('/api/cron/reconcile-payments', () => {
  it('rejects requests without the cron bearer', async () => {
    process.env = { ...OLD_ENV, CRON_SECRET: 'cron-secret' }
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(request())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards cron bearer to backend reconcile endpoint', async () => {
    process.env = { ...OLD_ENV, CRON_SECRET: 'cron-secret' }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ checked: 3, drift_detected: 1, drift_ids: [42] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(request('cron-secret'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'success',
      checked: 3,
      drift_detected: 1,
      drift_ids: [42],
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/internal/payments/reconcile')
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
      Authorization: 'Bearer cron-secret',
      'Content-Type': 'application/json',
    })
    expect(fetchMock.mock.calls[0][1]?.body).toBe('{}')
  })
})
