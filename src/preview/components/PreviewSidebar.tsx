'use client'

import type { PreviewRegistryEntry } from '@/preview/registry'

export interface PreviewSidebarProps {
  registry: PreviewRegistryEntry[]
  activeId: string
  onSelect: (id: string) => void
}

export function PreviewSidebar({ registry, activeId, onSelect }: PreviewSidebarProps) {
  return (
    <aside className="w-60 shrink-0 border-r border-[var(--color-border)] p-3">
      <p className="mb-2 text-xs font-semibold uppercase text-[var(--color-foreground-muted)]">
        Components
      </p>
      <ul className="space-y-1">
        {registry.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onSelect(entry.id)}
              className={`w-full rounded px-2 py-1 text-left text-sm ${
                activeId === entry.id
                  ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                  : 'hover:bg-[var(--color-background-secondary)]'
              }`}
            >
              {entry.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
