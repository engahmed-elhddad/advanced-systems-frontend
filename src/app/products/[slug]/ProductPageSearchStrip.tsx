'use client'

import { SearchBar } from '@/components/search/SearchBar'
import { cn } from '@/lib/utils'

export function ProductPageSearchStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/15 bg-white/[0.06] p-4 shadow-[0_0_48px_rgba(168,85,247,0.14),0_0_36px_rgba(255,122,0,0.12)] backdrop-blur-xl transition-all duration-300',
        'hover:border-orange-400/25 hover:shadow-[0_0_56px_rgba(168,85,247,0.18),0_0_44px_rgba(255,122,0,0.16)]',
        className
      )}
    >
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Search catalog</p>
      <SearchBar
        variant="header"
        placeholder="Search part number, brand, series…"
        showSuggestions
        searchPath="/search"
        productPath="/products"
        brandPath="/brands"
        categoryPath="/categories"
        className="max-w-3xl"
      />
    </div>
  )
}
