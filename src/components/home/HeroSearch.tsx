'use client'

import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import { cn } from '@/lib/utils'

const PLACEHOLDER = 'Search industrial part numbers'
const EXAMPLES = ['6EP1333', '3RT1015', 'XCK-M115', '6ES7214']

const POPULAR_SEARCHES = [
  '6ES7315-2AH14-0AB0',
  '6EP1333-2BA20',
  '3RT1015-1BB41',
  'XCK-M115',
  'S8VK-G24024',
]

/** Hero search — large glass surface + gradient submit (header uses compact pill). */
export function HeroSearch({ variant = 'default' }: { variant?: 'default' | 'hero' }) {
  const isHero = variant === 'hero'
  return (
    <div className={cn('mx-auto w-full', isHero ? 'max-w-3xl lg:max-w-[48rem]' : 'max-w-2xl')}>
      <SearchBar
        variant={isHero ? 'hero' : 'header'}
        placeholder={PLACEHOLDER}
        showSuggestions
        debounceMs={300}
        minLength={1}
        suggestionLimit={10}
        searchPath="/search"
        productPath="/products"
        brandPath="/brands"
        categoryPath="/categories"
        className="w-full"
      />
      <p
        className={cn(
          'mt-4 text-center text-[0.8125rem] leading-relaxed',
          isHero ? 'text-white/50' : 'text-white/40',
        )}
      >
        <span className="font-medium text-white/55">Examples</span>
        <span className="mx-1.5 text-white/30">·</span>
        <span className={cn('font-mono text-[0.78rem] tracking-tight', isHero ? 'text-white/75' : 'text-white/65')}>
          {EXAMPLES.join(', ')}
        </span>
      </p>
      {isHero && (
        <div className="mt-8">
          <p className="mb-3.5 text-center text-label-caps text-white/38">Popular searches</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {POPULAR_SEARCHES.map((part) => (
              <Link
                key={part}
                href={`/search?q=${encodeURIComponent(part)}`}
                className="rounded-full border border-white/[0.09] bg-white/[0.05] px-4 py-2 font-mono text-[0.72rem] text-white/82 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-300/25 hover:bg-white/[0.09] hover:text-white hover:shadow-[0_8px_24px_-6px_rgba(255,122,0,0.2)]"
              >
                {part}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
