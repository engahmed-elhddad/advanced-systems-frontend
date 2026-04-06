'use client'

import { useMemo, useState } from 'react'
import { useUIStore } from '@/state/useUIStore'
import type { PreviewRegistryEntry, PreviewVariant } from '@/preview/registry'

export interface PreviewShellProps {
  registry: PreviewRegistryEntry[]
}

export function PreviewShell({ registry }: PreviewShellProps) {
  const [selectedId, setSelectedId] = useState(registry[0]?.id ?? '')
  const [variantId, setVariantId] = useState(registry[0]?.variants[0]?.id ?? '')
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const toggleTheme = useUIStore((s) => s.toggleTheme)

  const entry = useMemo(
    () => registry.find((r) => r.id === selectedId) ?? registry[0],
    [registry, selectedId]
  )

  const variant: PreviewVariant | undefined = useMemo(() => {
    if (!entry) return undefined
    return entry.variants.find((v) => v.id === variantId) ?? entry.variants[0]
  }, [entry, variantId])

  const grouped = useMemo(() => {
    const m: Record<string, PreviewRegistryEntry[]> = { ui: [], shared: [], features: [] }
    for (const r of registry) {
      m[r.category].push(r)
    }
    return m
  }, [registry])

  const width =
    viewport === 'mobile' ? 375 : viewport === 'tablet' ? 768 : 1200

  return (
    <div className="flex min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <aside className="w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-foreground-muted)]">
          Components
        </p>
        {(['ui', 'shared', 'features'] as const).map((cat) =>
          grouped[cat].length ? (
            <div key={cat} className="mb-3">
              <p className="text-[10px] uppercase text-[var(--color-foreground-muted)]">{cat}</p>
              <ul className="mt-1 space-y-1">
                {grouped[cat].map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={`w-full rounded px-2 py-1 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] ${
                        r.id === entry?.id ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'hover:bg-[var(--color-background-tertiary)]'
                      }`}
                      onClick={() => {
                        setSelectedId(r.id)
                        setVariantId(r.variants[0]?.id ?? '')
                      }}
                    >
                      {r.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        )}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-4 py-2">
          <button
            type="button"
            className="rounded-md border border-[var(--color-border)] px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            onClick={() => toggleTheme()}
          >
            Theme
          </button>
          {(['mobile', 'tablet', 'desktop'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`rounded-md px-3 py-1 text-sm capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] ${
                viewport === v ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'border border-[var(--color-border)]'
              }`}
              onClick={() => setViewport(v)}
            >
              {v}
            </button>
          ))}
          <button
            type="button"
            className="ml-auto rounded-md border border-[var(--color-border)] px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            onClick={() => {
              if (variant) void navigator.clipboard.writeText(variant.jsx)
            }}
          >
            Copy JSX
          </button>
        </header>
        <div className="flex flex-1 min-h-0">
          <main className="flex flex-1 items-start justify-center overflow-auto p-6">
            <div
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 transition-[width] duration-200"
              style={{ width }}
            >
              {variant?.node}
            </div>
          </main>
          <aside className="w-80 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4 text-sm">
            <p className="font-semibold">Variants</p>
            <div className="mt-2 space-y-1">
              {entry?.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`block w-full rounded px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] ${
                    v.id === variant?.id ? 'bg-[var(--color-primary)]/15' : 'hover:bg-[var(--color-background-tertiary)]'
                  }`}
                  onClick={() => setVariantId(v.id)}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="mt-4 font-semibold">JSX</p>
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-[var(--color-background)] p-2 text-xs text-[var(--color-foreground-muted)]">
              {variant?.jsx}
            </pre>
          </aside>
        </div>
      </div>
    </div>
  )
}
