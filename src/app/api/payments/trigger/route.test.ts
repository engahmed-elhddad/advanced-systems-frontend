import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

const OLD_ENV = process.env

afterEach(() => {
  process.env = OLD_ENV
  vi.unstubAllGlobals()
})

function request(body: unknown, headers?: HeadersInit) {
  return new NextRequest('http://localhost/api/payments/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('/api/payments/trigger', () => {
  it('rejects anonymous requests before backend calls', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(request({ action: 'expire' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'missing_admin_bearer' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not call cron upstream when backend admin auth fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 403 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(request({ action: 'expire' }, { Authorization: 'Bearer user-token' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'invalid_admin_bearer' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/auth/me')
  })

  it('forwards only the cron secret to payment internal endpoints after admin verification', async () => {
    process.env = { ...OLD_ENV, CRON_SECRET: 'cron-secret' }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ expired_count: 2 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(request({ action: 'expire' }, { Authorization: 'Bearer admin-token' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ expired_count: 2 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ Authorization: 'Bearer admin-token' })
    expect(fetchMock.mock.calls[1][0]).toContain('/api/v1/internal/payments/expire-stale')
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: 'Bearer cron-secret',
      'Content-Type': 'application/json',
    })
  })
})
