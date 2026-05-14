import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

const OLD_ENV = process.env

afterEach(() => {
  process.env = OLD_ENV
  vi.unstubAllGlobals()
})

function request(secret?: string) {
  return new NextRequest('http://localhost/api/cron/search-consistency', {
    headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
  })
}

describe('/api/cron/search-consistency', () => {
  it('rejects requests without the cron bearer', async () => {
    process.env = { ...OLD_ENV, CRON_SECRET: 'cron-secret' }
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(request())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards cron bearer and operations user-agent to backend consistency endpoint', async () => {
    process.env = { ...OLD_ENV, CRON_SECRET: 'cron-secret' }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          db_count: 203,
          meili_count: 203,
          missing_in_meili_count: 0,
          orphaned_in_meili_count: 0,
          consistent: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(request('cron-secret'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'success',
      db_count: 203,
      meili_count: 203,
      consistent: true,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/internal/search/consistency-check')
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
      Authorization: 'Bearer cron-secret',
      'Content-Type': 'application/json',
      'User-Agent': 'AdvancedSystems-Operations/1.0',
    })
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ batch_size: 500 }))
  })
})
