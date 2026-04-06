'use client'

import Link from 'next/link'
import React from 'react'
import type { SearchHit } from '@/types/search'

function highlight(text: string, query: string) {
  const q = query.trim()
  if (!q) return text
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return text
  const before = text.slice(0, i)
  const match = text.slice(i, i + q.length)
  const after = text.slice(i + q.length)
  return (
    <>
      {before}
      <mark>{match}</mark>
      {after}
    </>
  )
}

export const SearchResultItem = React.memo(function SearchResultItem({
  hit,
  query,
}: {
  hit: SearchHit
  query: string
}) {
  const title = hit.name || hit.part_number
  const href = hit.slug ? `/products/${hit.slug}` : `/products/${encodeURIComponent(hit.part_number)}`
  return (
    <article role="article" className="rounded-[var(--radius-3)] border border-[var(--color-border)] p-3">
      <Link href={href} className="block">
        <h3 className="font-medium text-[var(--color-foreground)]">{highlight(title, query)}</h3>
        <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
          {hit.brand_name || hit.brand || 'Unknown brand'} - {hit.category_name || hit.category || 'Category'}
        </p>
      </Link>
    </article>
  )
})
