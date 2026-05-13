import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

const OLD_ENV = process.env

afterEach(() => {
  process.env = OLD_ENV
  vi.unstubAllGlobals()
})

function request(body: unknown, headers?: HeadersInit) {
  return new NextRequest('http://localhost/api/crawl-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('/api/crawl-image', () => {
  it('rejects anonymous requests before backend calls', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(request({ part_number: 'LC1D09' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'missing_admin_bearer' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not continue to image crawling when backend admin auth fails', async () => {
    process.env = { ...OLD_ENV, ADMIN_API_KEY: 'server-admin-key' }
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 403 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(
      request({ part_number: 'LC1D09' }, { Authorization: 'Bearer user-token' }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'invalid_admin_bearer' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/auth/me')
  })

  it('requires server ADMIN_API_KEY after backend admin verification', async () => {
    process.env = { ...OLD_ENV, ADMIN_API_KEY: '' }
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(
      request({ part_number: 'LC1D09' }, { Authorization: 'Bearer admin-token' }),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'ADMIN_API_KEY is not configured on the server',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/auth/me')
  })
})
