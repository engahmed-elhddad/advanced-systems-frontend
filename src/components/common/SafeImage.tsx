'use client'

import { useEffect, useState } from 'react'
import { resolveImage } from '@/utils/resolveImage'

interface SafeImageProps {
  src: string | null | undefined
  alt: string
  className?: string
}

export function SafeImage({ src, alt, className }: SafeImageProps) {
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
      loading="lazy"
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

