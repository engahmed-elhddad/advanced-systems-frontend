export type EnrichmentSourceBadgeProps = {
  source: string | null | undefined
  className?: string
}

function paletteFor(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('mouser')) return 'bg-blue-500/15 text-blue-300 border-blue-400/30'
  if (s.includes('rs components') || s === 'rs') return 'bg-red-500/15 text-red-300 border-red-400/30'
  if (s.includes('radwell')) return 'bg-purple-500/15 text-purple-300 border-purple-400/30'
  if (s.includes('google')) return 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30'
  if (s.includes('ai') || s.includes('claude') || s.includes('gpt') || s.includes('gemini')) {
    return 'bg-violet-500/15 text-violet-300 border-violet-400/30'
  }
  return 'bg-gray-500/15 text-gray-300 border-gray-400/30'
}

export function EnrichmentSourceBadge({ source, className }: EnrichmentSourceBadgeProps) {
  const trimmed = source?.trim()
  if (!trimmed) return null
  const palette = paletteFor(trimmed)
  const baseClass = 'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium'
  const cls = className ? `${baseClass} ${palette} ${className}` : `${baseClass} ${palette}`
  return (
    <span
      className={cls}
      title={`Auto-filled from ${trimmed}. Edit manually to override.`}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-2.5 w-2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="3 8 7 12 13 4" />
      </svg>
      {trimmed}
    </span>
  )
}
