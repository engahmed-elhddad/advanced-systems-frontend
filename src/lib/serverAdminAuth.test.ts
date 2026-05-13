import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { requireBackendAdmin } from './serverAdminAuth'

afterEach(() => {
  vi.unstubAllGlobals()
})

function request(headers?: HeadersInit) {
  return new NextRequest('http://localhost/api/test', { headers })
}

describe('requireBackendAdmin', () => {
  it('rejects missing bearer token without calling the backend', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await requireBackendAdmin(request())

    expect(response?.status).toBe(401)
    await expect(response?.json()).resolves.toEqual({ error: 'missing_admin_bearer' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects invalid backend admin token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 403 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await requireBackendAdmin(request({ Authorization: 'Bearer user-token' }))

    expect(response?.status).toBe(401)
    await expect(response?.json()).resolves.toEqual({ error: 'invalid_admin_bearer' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('allows a backend-verified admin token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))

    await expect(requireBackendAdmin(request({ Authorization: 'Bearer admin-token' }))).resolves.toBeNull()
  })
})
