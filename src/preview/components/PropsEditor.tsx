'use client'

import { useEffect, useState } from 'react'

export interface PropsEditorProps {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

export function PropsEditor({ value, onChange }: PropsEditorProps) {
  const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2))

  useEffect(() => {
    setDraft(JSON.stringify(value, null, 2))
  }, [value])

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Props</p>
      <textarea
        className="min-h-52 w-full rounded-[var(--radius-3)] border border-[var(--color-border)] bg-[var(--color-background)] p-2 font-mono text-xs"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button
        type="button"
        className="rounded-[var(--radius-3)] border border-[var(--color-border)] px-3 py-1 text-sm"
        onClick={() => {
          try {
            const parsed = JSON.parse(draft) as Record<string, unknown>
            onChange(parsed)
          } catch {
            // keep invalid JSON in editor until corrected
          }
        }}
      >
        Apply JSON
      </button>
    </div>
  )
}
