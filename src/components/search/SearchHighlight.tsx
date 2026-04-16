'use client'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Bold matching substrings for search UI (multi-token, case-insensitive).
 * Longest tokens first so longer phrases win over their prefixes.
 */
export function HighlightMatch({ text, query }: { text: string; query: string }) {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1)
  if (!text || tokens.length === 0) return <>{text}</>
  const sorted = [...new Set(tokens)].sort((a, b) => b.length - a.length)
  try {
    const pattern = sorted.map(escapeRegExp).join('|')
    if (!pattern) return <>{text}</>
    const parts = text.split(new RegExp(`(${pattern})`, 'gi'))
    const lowerSet = new Set(sorted.map((t) => t.toLowerCase()))
    return (
      <>
        {parts.map((part, i) =>
          lowerSet.has(part.toLowerCase()) ? (
            <mark key={i} className="bg-transparent font-semibold text-orange-200/95">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </>
    )
  } catch {
    return <>{text}</>
  }
}
