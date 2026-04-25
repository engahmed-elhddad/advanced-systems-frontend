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
      <p className="mt-4 text-center text-[0.8125rem] leading-relaxed text-[--text-secondary]">
        <span className="font-medium">Examples</span>
        <span className="mx-1.5 opacity-40">·</span>
        <span className="font-mono text-[0.78rem] tracking-tight text-[--text-primary]">
          {EXAMPLES.join(', ')}
        </span>
      </p>
      {isHero && (
        <div className="mt-8">
          <p className="mb-3.5 text-center text-label-caps text-[--text-secondary]">Popular searches</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {POPULAR_SEARCHES.map((part) => (
              <Link
                key={part}
                href={`/search?q=${encodeURIComponent(part)}`}
                className="rounded-full border border-[--border] bg-[--bg-elevated] px-4 py-2 font-mono text-[0.72rem] text-[--text-secondary] transition-colors hover:border-[--accent] hover:text-[--text-primary]"
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
