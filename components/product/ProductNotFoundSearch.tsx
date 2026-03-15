'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

export interface ProductNotFoundSearchProps {
  defaultQuery: string
  placeholder?: string
  className?: string
}

export function ProductNotFoundSearch({
  defaultQuery,
  placeholder = 'Search for similar parts',
  className = '',
}: ProductNotFoundSearchProps) {
  const router = useRouter()
  const [q, setQ] = useState(defaultQuery)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Search for similar parts"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  )
}
