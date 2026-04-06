'use client'

export function CodePreview({ code }: { code: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">JSX</p>
      <pre className="max-h-72 overflow-auto rounded-[var(--radius-3)] border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-xs text-[var(--color-foreground-muted)]">
        {code}
      </pre>
    </div>
  )
}
