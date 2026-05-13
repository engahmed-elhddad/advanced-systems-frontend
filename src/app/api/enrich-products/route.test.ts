import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

const OLD_ENV = process.env

afterEach(() => {
  process.env = OLD_ENV
  vi.unstubAllGlobals()
})

function request(headers?: HeadersInit) {
  return new NextRequest('http://localhost/api/enrich-products', {
    method: 'POST',
    headers,
  })
}

describe('/api/enrich-products', () => {
  it('rejects anonymous requests before backend calls', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(request())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'missing_admin_bearer' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not forward ADMIN_API_KEY when backend admin auth fails', async () => {
    process.env = { ...OLD_ENV, ADMIN_API_KEY: 'server-admin-key' }
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(request({ Authorization: 'Bearer user-token' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'invalid_admin_bearer' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/auth/me')
  })

  it('forwards server ADMIN_API_KEY only after backend admin verification', async () => {
    process.env = { ...OLD_ENV, ADMIN_API_KEY: 'server-admin-key' }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ updated: 1 }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(request({ Authorization: 'Bearer admin-token' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ updated: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ Authorization: 'Bearer admin-token' })
    expect(fetchMock.mock.calls[1][0]).toContain('/admin/enrich-products')
    expect(fetchMock.mock.calls[1][1]?.headers).toEqual({ 'api-key': 'server-admin-key' })
  })
})
