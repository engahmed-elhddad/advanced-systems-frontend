'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'
import { formatEgp, formatUsd } from '@/lib/pricing'
import { useI18n } from '@/lib/i18n'

export default function CheckoutPage() {
  const { items, totals, checkout, isLoading } = useCart()
  const { locale, t } = useI18n()
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
        payment_method: 'bank_transfer',
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : locale === 'ar' ? 'فشل إرسال طلب عرض السعر' : 'Quote request failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-[--text-primary]">{t('checkout.title')}</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          {t('checkout.subtitle')}
        </p>
      </header>

      {result ? (
        <section className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-5">
          <h2 className="text-lg font-semibold text-[--text-primary]">
            {result.approval_required ? t('checkout.approvalRequested') : t('checkout.confirmed')}
          </h2>
          <p className="mt-2 text-sm text-[--text-primary]">
            {locale === 'ar' ? 'المرجع' : 'Reference'}: <span className="font-mono">{result.order_ref}</span>
          </p>
          <p className="mt-1 text-sm text-[--text-secondary]">
            {locale === 'ar' ? 'التدفق' : 'Flow'}: {locale === 'ar' ? 'طلب عرض سعر' : 'Quote request'}
          </p>
          {result.approval_required ? (
            <p className="mt-1 text-sm text-amber-200">
              {locale === 'ar'
                ? 'تم إشعار المعتمد عبر واتساب. سيستكمل الطلب بعد الموافقة.'
                : 'An approver has been notified on WhatsApp. Your order will continue after approval.'}
            </p>
          ) : null}
          {result.notification.attempted ? (
            <p className="mt-1 text-sm text-[--text-secondary]">
              {locale === 'ar' ? 'تأكيد واتساب' : 'WhatsApp confirmation'}:{' '}
              {result.notification.sent
                ? locale === 'ar' ? 'تم الإرسال' : 'sent'
                : locale === 'ar'
                  ? `فشل (${result.notification.error ?? 'غير معروف'})`
                  : `failed (${result.notification.error ?? 'unknown'})`}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[--text-secondary]">
              {locale === 'ar' ? 'لم تتم محاولة تأكيد واتساب (لا يوجد رقم هاتف).' : 'WhatsApp confirmation not attempted (no phone provided).'}
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <Button asChild variant="secondary">
              <Link href="/search">{t('checkout.continueShopping')}</Link>
            </Button>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-xl border border-[--border] bg-[--bg-elevated] p-5">
            <h2 className="text-lg font-semibold text-[--text-primary]">{t('checkout.quoteFlow')}</h2>
            <div className="mt-4 rounded-lg border border-[--border] bg-[--bg-surface] p-3">
              <p className="font-medium text-[--text-primary]">{t('checkout.quoteOnlyTitle')}</p>
              <p className="text-xs text-[--text-secondary]">{t('checkout.quoteOnlyHint')}</p>
            </div>

            <h3 className="mt-6 text-sm font-semibold text-[--text-primary]">
              {locale === 'ar' ? 'بيانات التواصل للتأكيد' : 'Contact for confirmation'}
            </h3>
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
                placeholder={locale === 'ar' ? 'email@company.com' : 'email@company.com'}
                className="rounded-lg border border-[--border] bg-[--bg-surface] px-3 py-2 text-sm text-[--text-primary]"
              />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={locale === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
              className="mt-3 min-h-24 w-full rounded-lg border border-[--border] bg-[--bg-surface] px-3 py-2 text-sm text-[--text-primary]"
            />

            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
            <Button className="mt-4 w-full" disabled={!canSubmit || isLoading} onClick={() => void onSubmit()}>
              {submitting ? t('checkout.processing') : t('checkout.confirmAction')}
            </Button>
          </section>

          <aside className="rounded-xl border border-[--border] bg-[--bg-elevated] p-5">
            <h2 className="text-lg font-semibold text-[--text-primary]">{t('checkout.orderSummary')}</h2>
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-[--text-secondary]">
                {locale === 'ar' ? `${items.length} سطر` : `${items.length} line(s)`}
              </p>
              {items.map((item) => (
                <div key={item.part_number} className="rounded-md border border-[--border] p-2">
                  <p className="font-mono text-xs text-[--text-primary]">{item.part_number}</p>
                  <p className="text-xs text-[--text-secondary]">
                    {locale === 'ar' ? 'الكمية' : 'Qty'} {item.qty} · {t('cart.hs')} {item.hs_code ?? 'N/A'}
                  </p>
                </div>
              ))}
              <hr className="border-[--border]" />
              <p className="flex justify-between text-[--text-secondary]">
                <span>{t('cart.subtotal')}</span>
                <span>{formatUsd(totals.subtotal_usd)} · {formatEgp(totals.subtotal_egp)}</span>
              </p>
              <p className="flex justify-between text-[--text-secondary]">
                <span>{t('cart.vat')}</span>
                <span>{formatUsd(totals.vat_usd)} · {formatEgp(totals.vat_egp)}</span>
              </p>
              <p className="flex justify-between font-semibold text-[--text-primary]">
                <span>{t('cart.total')}</span>
                <span>{formatUsd(totals.total_usd)} · {formatEgp(totals.total_egp)}</span>
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}
