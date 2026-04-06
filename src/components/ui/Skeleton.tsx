'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps {
  variant?: 'line' | 'circle' | 'rect'
  width?: number | string
  height?: number | string
  className?: string
  count?: number
}

export const SkeletonLine = React.memo(function SkeletonLine(props: SkeletonProps) {
  return <Skeleton {...props} />
})

function SkeletonInner({ variant = 'line', width, height, className, count = 1 }: SkeletonProps) {
  const style: React.CSSProperties = {}
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height

  return Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className={cn(
        'skeleton',
        variant === 'circle' && 'aspect-square rounded-full',
        variant === 'rect' && 'rounded-[var(--radius-3)]',
        variant === 'line' && 'h-4 rounded-[var(--radius-2)]',
        className
      )}
      style={style}
      aria-hidden
    />
  ))
}

export const Skeleton = React.memo(SkeletonInner)
