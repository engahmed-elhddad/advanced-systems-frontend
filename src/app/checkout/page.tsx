'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'
import { formatEgp, formatUsd } from '@/lib/pricing'

type PaymentMethod = 'paymob_card' | 'bank_transfer' | 'net_30'

const METHODS: Array<{ id: PaymentMethod; label: string; hint: string }> = [
  { id: 'paymob_card', label: 'Card payment (Paymob)', hint: 'Pay securely via Paymob checkout.' },
  { id: 'bank_transfer', label: 'Bank transfer', hint: 'Transfer to our bank account and share receipt.' },
  { id: 'net_30', label: 'Net-30 (approved B2B only)', hint: 'Available for verified company accounts.' },
]

export default function CheckoutPage() {
  const { items, totals, checkout, isLoading } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paymob_card')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<null | {
    order_ref: string
    payment_method: string
    approval_required?: boolean
    payment_context: Record<string, unknown>
    notification: { attempted: boolean; sent: boolean; error?: string | null }
  }>(null)

  const canSubmit = useMemo(() => items.length > 0 && !submitting, [items.length, submitting])

  async function onSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await checkout({
        payment_method: paymentMethod,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-[--text-primary]">Checkout</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          VAT 14% and dual-currency totals are shown before confirmation.
        </p>
      </header>

      {result ? (
        <section className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-5">
          <h2 className="text-lg font-semibold text-emerald-100">
            {result.approval_required ? 'Approval requested' : 'Order confirmed'}
          </h2>
          <p className="mt-2 text-sm text-[--text-primary]">
            Reference: <span className="font-mono">{result.order_ref}</span>
          </p>
          <p className="mt-1 text-sm text-[--text-secondary]">
            Payment: {result.payment_method.replace('_', ' ')}
          </p>
          {result.approval_required ? (
            <p className="mt-1 text-sm text-amber-200">
              An approver has been notified on WhatsApp. Your order will continue after approval.
            </p>
          ) : null}
          {result.notification.attempted ? (
            <p className="mt-1 text-sm text-[--text-secondary]">
              WhatsApp confirmation: {result.notification.sent ? 'sent' : `failed (${result.notification.error ?? 'unknown'})`}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[--text-secondary]">WhatsApp confirmation not attempted (no phone provided).</p>
          )}
          <div className="mt-4 flex gap-3">
            <Button asChild variant="secondary">
              <Link href="/search">Continue shopping</Link>
            </Button>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-xl border border-[--border] bg-[--bg-elevated] p-5">
            <h2 className="text-lg font-semibold text-[--text-primary]">Payment method</h2>
            <div className="mt-4 space-y-3">
              {METHODS.map((method) => (
                <label key={method.id} className="block cursor-pointer rounded-lg border border-[--border] p-3 hover:border-[--accent]/35">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <div>
                      <p className="font-medium text-[--text-primary]">{method.label}</p>
                      <p className="text-xs text-[--text-secondary]">{method.hint}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <h3 className="mt-6 text-sm font-semibold text-[--text-primary]">Contact for confirmation</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2010..."
                className="rounded-lg border border-[--border] bg-[--bg-surface] px-3 py-2 text-sm text-[--text-primary]"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                className="rounded-lg border border-[--border] bg-[--bg-surface] px-3 py-2 text-sm text-[--text-primary]"
              />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="mt-3 min-h-24 w-full rounded-lg border border-[--border] bg-[--bg-surface] px-3 py-2 text-sm text-[--text-primary]"
            />

            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
            <Button className="mt-4 w-full" disabled={!canSubmit || isLoading} onClick={() => void onSubmit()}>
              {submitting ? 'Processing checkout...' : 'Confirm checkout'}
            </Button>
          </section>

          <aside className="rounded-xl border border-[--border] bg-[--bg-elevated] p-5">
            <h2 className="text-lg font-semibold text-[--text-primary]">Order summary</h2>
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-[--text-secondary]">{items.length} line(s)</p>
              {items.map((item) => (
                <div key={item.part_number} className="rounded-md border border-[--border] p-2">
                  <p className="font-mono text-xs text-[--text-primary]">{item.part_number}</p>
                  <p className="text-xs text-[--text-secondary]">
                    Qty {item.qty} · HS {item.hs_code ?? 'N/A'}
                  </p>
                </div>
              ))}
              <hr className="border-[--border]" />
              <p className="flex justify-between text-[--text-secondary]">
                <span>Subtotal</span>
                <span>{formatUsd(totals.subtotal_usd)} · {formatEgp(totals.subtotal_egp)}</span>
              </p>
              <p className="flex justify-between text-[--text-secondary]">
                <span>VAT 14%</span>
                <span>{formatUsd(totals.vat_usd)} · {formatEgp(totals.vat_egp)}</span>
              </p>
              <p className="flex justify-between font-semibold text-[--text-primary]">
                <span>Total</span>
                <span>{formatUsd(totals.total_usd)} · {formatEgp(totals.total_egp)}</span>
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}
