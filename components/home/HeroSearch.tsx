'use client'

import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'

const PLACEHOLDER = 'Search industrial part numbers'
const EXAMPLES = ['6EP1333', '3RT1015', 'XCK-M115', '6ES7214']

const POPULAR_SEARCHES = [
  '6ES7315-2AH14-0AB0',
  '6EP1333-2BA20',
  '3RT1015-1BB41',
  'XCK-M115',
  'S8VK-G24024',
]

/** Hero search: same SearchBar as header with variant="hero" (height 56px, glow, larger font). Autocomplete and routing identical. */
export function HeroSearch({ variant = 'default' }: { variant?: 'default' | 'hero' }) {
  const isHero = variant === 'hero'
  return (
    <div className="mx-auto max-w-2xl">
      <div
        className={
          isHero
            ? 'rounded-xl border-0 bg-transparent shadow-none'
            : 'rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm'
        }
      >
        <SearchBar
          variant="hero"
          placeholder={PLACEHOLDER}
          showSuggestions
          debounceMs={300}
          minLength={2}
          suggestionLimit={8}
          searchPath="/search"
          productPath="/part-number"
          brandPath="/brand"
          categoryPath="/category"
          className="border-0 shadow-none p-0"
        />
      </div>
      <p className={`mt-2 text-center text-xs ${isHero ? 'text-slate-400' : 'text-gray-500'}`}>
        Examples: <span className={isHero ? 'font-mono text-slate-300' : 'font-mono text-gray-600'}>{EXAMPLES.join(', ')}</span>
      </p>
      {isHero && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Popular Searches
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR_SEARCHES.map((part) => (
              <Link
                key={part}
                href={`/search?q=${encodeURIComponent(part)}`}
                className="rounded-lg bg-white/10 px-3 py-1 text-sm text-slate-200 hover:bg-white/20 transition-colors font-mono"
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
