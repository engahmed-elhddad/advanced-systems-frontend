'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { RefreshCw, Trash2 } from 'lucide-react'

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

type StockOffer = {
  offer_id: number
  part_number: string
  condition: string
  price: number
  quantity: number
}

async function errorMessageFromResponse(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown }
    const d = data?.detail
    if (typeof d === 'string') return d
    if (Array.isArray(d) && d.length) return String(d[0])
  } catch {
    /* ignore */
  }
  return res.statusText || `Request failed (${res.status})`
}

export default function StockPage() {
  const adminKey = (process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '').trim()
  const [offers, setOffers] = useState<StockOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!adminKey) {
      setOffers([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/admin/stock-dashboard`, {
        headers: { 'api-key': adminKey },
      })
      if (!res.ok) {
        throw new Error(await errorMessageFromResponse(res))
      }
      const data = (await res.json()) as { offers?: StockOffer[] }
      setOffers(Array.isArray(data.offers) ? data.offers : [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load stock offers'
      toast.error(msg)
      setOffers([])
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    void load()
  }, [load])

  async function deleteOffer(id: number) {
    if (!adminKey) return
    setDeletingId(id)
    try {
      const res = await apiFetch(`${API_BASE}/admin/delete-offer?offer_id=${id}`, {
        method: 'DELETE',
        headers: { 'api-key': adminKey },
      })
      if (!res.ok) {
        throw new Error(await errorMessageFromResponse(res))
      }
      setOffers((prev) => prev.filter((o) => o.offer_id !== id))
      toast.success('Offer deleted')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete offer'
      toast.error(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Manager</h1>
          <p className="mt-1 text-sm text-white/60">Supplier offers and quantities (legacy API key).</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          surface="dark"
          className="shrink-0"
          disabled={!adminKey || loading}
          loading={loading}
          onClick={() => void load()}
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          Refresh
        </Button>
      </div>

      {!adminKey ? (
        <Card className="border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 backdrop-blur-xl">
          Set <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-50">NEXT_PUBLIC_ADMIN_API_KEY</code> in{' '}
          <code className="rounded bg-black/30 px-1.5 py-0.5">.env.local</code> to load offers.
        </Card>
      ) : null}

      <Card className="overflow-hidden border border-white/10 bg-white/5 p-0 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm text-white/90">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-xs font-semibold uppercase tracking-wide text-white/55">
                <th className="px-4 py-3">Part number</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && offers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-white/50">
                    Loading offers…
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-white/50">
                    No offers to display.
                  </td>
                </tr>
              ) : (
                offers.map((o) => (
                  <tr key={o.offer_id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium text-white">{o.part_number}</td>
                    <td className="px-4 py-3 text-white/75">{o.condition}</td>
                    <td className="px-4 py-3 tabular-nums text-white/85">${Number(o.price).toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums text-white/85">{o.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        surface="dark"
                        size="sm"
                        loading={deletingId === o.offer_id}
                        disabled={deletingId !== null}
                        className="inline-flex items-center gap-1.5"
                        onClick={() => void deleteOffer(o.offer_id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
