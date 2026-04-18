'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ProductImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
  sizes?: string
  priority?: boolean
}

function shouldUnoptimize(src: string): boolean {
  if (src.includes('/uploads/')) return true
  if (src.startsWith('blob:') || src.startsWith('data:')) return true
  if (src.startsWith('http://') || src.startsWith('https://')) return true
  return false
}

/** next/image with automatic fallback — use inside a sized or aspect-ratio parent for stable layout. */
export function ProductImageWithFallback({
  src,
  alt,
  className,
  fallbackSrc = '/placeholder.png',
  sizes,
  priority = false,
}: ProductImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)

  useEffect(() => {
    setImgSrc(src)
  }, [src])

  return (
    <div className="relative h-full w-full min-h-[1px] min-w-0">
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes={sizes ?? '(max-width: 768px) 50vw, 25vw'}
        className={cn(className)}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        unoptimized={shouldUnoptimize(imgSrc)}
        onError={() => setImgSrc((cur) => (cur === fallbackSrc ? cur : fallbackSrc))}
      />
    </div>
  )
}

export default ProductImageWithFallback
