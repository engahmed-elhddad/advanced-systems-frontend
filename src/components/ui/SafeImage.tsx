'use client'

import { useEffect, useState } from 'react'
import { resolveImage } from '@/lib/resolveImage'

interface SafeImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  /** LCP / hero — eager load + high fetch priority */
  priority?: boolean
  /** Responsive hint for the browser (e.g. "(max-width:768px) 100vw, 50vw") */
  sizes?: string
}

export function SafeImage({ src, alt, className, priority, sizes }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(resolveImage(src))

  useEffect(() => {
    setCurrentSrc(resolveImage(src))
  }, [src])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={(event) => {
        const img = event.currentTarget
        if (img.dataset.fallbackApplied === 'true') return
        img.dataset.fallbackApplied = 'true'
        setCurrentSrc('/placeholder.png')
      }}
    />
  )
}
