'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { resolveImage } from '@/lib/resolveImage'
import { cn } from '@/lib/utils'

const PLACEHOLDER = '/placeholder.png'

interface SafeImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  /** LCP / hero — eager load + priority decoding */
  priority?: boolean
  /** Width hint for responsive `srcset` (required for good LCP / CLS with `fill`). */
  sizes?: string
}

function shouldUnoptimize(src: string): boolean {
  if (src.startsWith('/uploads/')) return true
  if (src.startsWith('blob:') || src.startsWith('data:')) return true
  return false
}

export function SafeImage({ src, alt, className, priority, sizes }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(() => resolveImage(src))

  useEffect(() => {
    setCurrentSrc(resolveImage(src))
  }, [src])

  const handleError = () => {
    if (currentSrc === PLACEHOLDER) return
    setCurrentSrc(PLACEHOLDER)
  }

  return (
    <div className="relative h-full w-full min-h-0 min-w-0">
      <Image
        src={currentSrc}
        alt={alt}
        fill
        sizes={sizes ?? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
        className={cn(className)}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        unoptimized={shouldUnoptimize(currentSrc)}
        onError={handleError}
      />
    </div>
  )
}
