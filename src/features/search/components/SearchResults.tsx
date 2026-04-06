'use client'

import Link from 'next/link'
import { normalizeSearchHits } from '@/services/api/search'
import type { SearchResponse } from '@/types/search'
import { Empty } from '@/components/shared/Empty'
import { Search } from 'lucide-react'

export interface SearchResultsProps {
  response: SearchResponse | undefined
  query: string
  activeIndex?: number
  onActivate?: (index: number) => void
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="bg-[var(--color-primary)]/25 text-[var(--color-foreground)]">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function SearchResults({ response, query, activeIndex = -1, onActivate }: SearchResultsProps) {
  if (!response) return null
  const hits = normalizeSearchHits(response)
  if (hits.length === 0) {
    return (
      <Empty
        icon={<Search className="h-12 w-12" />}
        title="No results"
        description={`Nothing matched “${query}”. Try another part number or keyword.`}
      />
    )
  }

  return (
    <div className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] bg-[var(--color-background-secondary)]">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-foreground-muted)]">
        Products
      </div>
      <ul role="listbox" className="max-h-[28rem] overflow-y-auto">
        {hits.map((h, i) => (
          <li key={`${h.part_number}-${i}`} role="option" aria-selected={i === activeIndex}>
            <Link
              href={`/products/${encodeURIComponent(h.part_number)}`}
              className={`block px-3 py-2 text-sm hover:bg-[var(--color-background-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] ${
                i === activeIndex ? 'bg-[var(--color-background-tertiary)]' : ''
              }`}
              onMouseEnter={() => onActivate?.(i)}
              onFocus={() => onActivate?.(i)}
            >
              <span className="font-mono font-semibold text-[var(--color-primary)]">
                <Highlight text={h.part_number} q={query} />
              </span>
              {h.name ? (
                <span className="ml-2 text-[var(--color-foreground-muted)]">
                  <Highlight text={h.name} q={query} />
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
