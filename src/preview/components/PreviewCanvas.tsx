'use client'

import type { ReactNode } from 'react'

export interface PreviewCanvasProps {
  width: number | 'full'
  children: ReactNode
}

export function PreviewCanvas({ width, children }: PreviewCanvasProps) {
  return (
    <main className="flex flex-1 justify-center overflow-auto p-6">
      <div
        className="rounded-[var(--radius-4)] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6"
        style={{ width: width === 'full' ? '100%' : width }}
      >
        {children}
      </div>
    </main>
  )
}
