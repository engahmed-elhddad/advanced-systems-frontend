'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { getProductImageCandidates, PRODUCT_PLACEHOLDER } from '@/lib/getProductImage'

interface ProductImageProps {
  partNumber: string
  alt: string
  variant?: 'hero' | 'card'
  className?: string
  sizes?: string
  priority?: boolean
}

/** Tries upload candidates in order, then placeholder — glass frame for dark UI. */
export function ProductImage({
  partNumber,
  alt,
  variant = 'card',
  className = '',
  sizes,
  priority = false,
}: ProductImageProps) {
  const candidates = getProductImageCandidates(partNumber)
  const [srcIndex, setSrcIndex] = useState(0)
  const currentSrc = srcIndex < candidates.length ? candidates[srcIndex] : PRODUCT_PLACEHOLDER

  useEffect(() => {
    setSrcIndex(0)
  }, [partNumber])

  const handleError = () => {
    if (srcIndex < candidates.length - 1) {
      setSrcIndex((i) => i + 1)
    } else {
      setSrcIndex(candidates.length)
    }
  }

  const isPlaceholder = currentSrc === PRODUCT_PLACEHOLDER
  const paddingClass = variant === 'hero' ? 'p-6' : 'p-4'

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner shadow-black/20 backdrop-blur-sm ${paddingClass}`}
      >
        {isPlaceholder ? (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-white/5 bg-white/[0.04]">
            <Package className="h-12 w-12 text-white/25" aria-hidden />
          </div>
        ) : (
          <div className="absolute inset-0 rounded-lg">
            <Image
              src={currentSrc}
              alt={alt}
              fill
              className="object-contain"
              sizes={
                sizes ??
                (variant === 'hero' ? '(max-width: 1024px) 100vw, 520px' : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw')
              }
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              unoptimized={currentSrc.startsWith('/uploads/') || currentSrc === PRODUCT_PLACEHOLDER}
              onError={handleError}
            />
          </div>
        )}
      </div>
    </div>
  )
}
