'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/Button'
import { formatEgp, formatUsd } from '@/lib/pricing'
import { useI18n } from '@/lib/i18n'

export type CartDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, totals, isLoading, removeItem, updateQty } = useCart()
  const [mutateError, setMutateError] = useState<string | null>(null)
  const { locale, t } = useI18n()

  useEffect(() => {
    if (!open) {
      setMutateError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm"
        aria-label={t('cart.title')}
        onClick={() => onOpenChange(false)}
      />
      <aside
        className="fixed inset-y-0 right-0 z-[110] flex w-full max-w-md flex-col border-l border-[--border-dark] shadow-2xl"
        style={{ backgroundColor: 'var(--bg-header)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between border-b border-[--border-dark] px-4 py-4 sm:px-5">
          <div>
            <h2 id="cart-drawer-title" className="text-lg font-semibold text-[--text-primary]">
              {t('cart.title')}
            </h2>
            <p className="mt-0.5 text-xs text-[--text-secondary]">
              {isLoading
                ? t('cart.loading', 'Loading…', 'جاري التحميل…')
                : items.length === 0
                  ? t('cart.empty', 'No items', 'لا توجد عناصر')
                  : locale === 'ar'
                    ? `${items.length} عنصر`
                    : `${items.length} line${items.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 text-[--text-secondary] transition-colors hover:bg-white/[0.08] hover:text-[--text-primary]"
            aria-label={t('nav.closeMenu', 'Close', 'إغلاق')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {isLoading ? (
            <p className="text-sm text-[--text-secondary]">{t('cart.loading')}</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <ShoppingCart className="h-12 w-12 text-[--text-secondary] opacity-40" aria-hidden />
              <p className="text-sm text-[--text-primary]">{t('cart.empty')}</p>
              <Link
                href="/search"
                onClick={() => onOpenChange(false)}
                className="text-sm font-medium text-[--accent] transition-colors hover:text-[--accent-hover]"
              >
                {t('cart.browse')}
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.part_number}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[--border-dark] bg-white/[0.04] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-semibold text-[--text-primary]">{item.part_number}</p>
                    {item.product_name ? <p className="mt-0.5 text-xs text-[--text-secondary]">{item.product_name}</p> : null}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[--text-secondary]">
                      <span>{t('cart.hs')}: {item.hs_code ?? 'N/A'}</span>
                      <span>{formatUsd(item.unit_price_usd) ?? '$0.00'} / {locale === 'ar' ? 'وحدة' : 'unit'}</span>
                      <span>{formatEgp(item.unit_price_egp) ?? 'EGP 0.00'} / {locale === 'ar' ? 'وحدة' : 'unit'}</span>
                    </div>
                    {item.notes ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[--text-secondary]">{item.notes}</p>
                    ) : null}
                    <div className="mt-1 text-xs font-semibold text-[--text-primary]">
                      {locale === 'ar' ? 'إجمالي السطر' : 'Line'}: {formatUsd(item.line_total_usd) ?? '$0.00'} · {formatEgp(item.line_total_egp) ?? 'EGP 0.00'}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={locale === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
                        disabled={item.qty <= 1}
                        onClick={() => {
                          setMutateError(null)
                          void updateQty(item.part_number, item.qty - 1).catch(() => setMutateError(locale === 'ar' ? 'تعذر تحديث الكمية.' : 'Could not update quantity.'))
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[--border-dark] text-[--text-secondary] transition-colors hover:border-white/20 hover:text-[--text-primary] disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-medium text-[--text-primary]">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        aria-label={locale === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
                        onClick={() => {
                          setMutateError(null)
                          void updateQty(item.part_number, item.qty + 1).catch(() => setMutateError(locale === 'ar' ? 'تعذر تحديث الكمية.' : 'Could not update quantity.'))
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[--border-dark] text-[--text-secondary] transition-colors hover:border-white/20 hover:text-[--text-primary]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={locale === 'ar' ? `حذف ${item.part_number}` : `Remove ${item.part_number}`}
                    onClick={() => {
                      setMutateError(null)
                      void removeItem(item.part_number).catch(() => setMutateError(locale === 'ar' ? 'تعذر حذف العنصر.' : 'Could not remove item.'))
                    }}
                    className="shrink-0 rounded-md p-2 text-[--text-secondary] transition-colors hover:bg-red-500/15 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[--border-dark] px-4 py-4 sm:px-5">
            <div className="mb-3 space-y-1 rounded-lg border border-[--border-dark] bg-white/[0.03] p-3 text-xs">
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
            {mutateError ? (
              <p className="mb-3 text-sm text-red-300" role="alert">
                {mutateError}
              </p>
            ) : null}
            <Button asChild type="button" className="w-full">
              <Link href="/checkout" onClick={() => onOpenChange(false)}>
                {t('cart.proceed')}
              </Link>
            </Button>
          </div>
        )}
      </aside>
    </>
  )
}
