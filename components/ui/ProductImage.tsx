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

/**
 * Renders product image trying /uploads/products/{partNumber}.jpg, .png, .webp in order, then placeholder.
 */
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
    <div className={`relative w-full h-full ${className}`}>
      <div className={`absolute inset-0 bg-white rounded-xl shadow-sm ${paddingClass} flex items-center justify-center`}>
        {isPlaceholder ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 text-gray-300" aria-hidden />
          </div>
        ) : (
          <div className="absolute inset-0 rounded-lg relative">
            <Image
              src={currentSrc}
              alt={alt}
              fill
              className="object-contain"
            sizes={sizes ?? (variant === 'hero' ? '(max-width: 1024px) 100vw, 520px' : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw')}
            priority={priority}
            unoptimized={currentSrc.startsWith('/uploads/') || currentSrc === PRODUCT_PLACEHOLDER}
              onError={handleError}
            />
          </div>
        )}
      </div>
    </div>
  )
}
