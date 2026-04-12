'use client'

import { useState, useEffect } from 'react'

interface ProductImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
}

/** img with automatic fallback — works on glass product tiles. */
export function ProductImageWithFallback({
  src,
  alt,
  className,
  fallbackSrc = '/products/no-product-image.jpg',
}: ProductImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)

  useEffect(() => {
    setImgSrc(src)
  }, [src])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imgSrc} alt={alt} loading="lazy" className={className} onError={() => setImgSrc(fallbackSrc)} />
  )
}

export default ProductImageWithFallback
