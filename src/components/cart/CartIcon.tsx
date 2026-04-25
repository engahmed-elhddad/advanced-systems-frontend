'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { CartDrawer } from '@/components/cart/CartDrawer'

export function CartIcon() {
  const { totalCount } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label={`Quote cart — ${totalCount} item${totalCount !== 1 ? 's' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-[--text-secondary] transition-colors hover:bg-white/[0.08] hover:text-[--text-primary]"
      >
        <ShoppingCart className="h-4 w-4" />
        {totalCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-[1rem] min-w-[1rem] items-center justify-center rounded-full bg-[--accent] px-0.5 text-[10px] font-bold leading-none text-white shadow-[0_2px_8px_rgba(255,106,0,0.45)]">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        ) : null}
      </button>
      <CartDrawer open={open} onOpenChange={setOpen} />
    </>
  )
}
