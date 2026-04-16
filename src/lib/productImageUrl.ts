/**
 * Single source for hero/card image URL from heterogeneous API shapes (slug detail vs list vs search).
 */
export function primaryProductImageUrl(product: Record<string, unknown> | null | undefined): string {
  if (!product || typeof product !== 'object') return ''
  const images = product.images
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0] as Record<string, unknown> | string
    if (typeof first === 'string') {
      const s = first.trim()
      if (s) return s
    } else if (first && typeof first === 'object') {
      const fromRow =
        String(first.image_url ?? first.url ?? '').trim()
      if (fromRow) return fromRow
    }
  }
  const top =
    String(product.image_url ?? '').trim() ||
    String(product.main_image_url ?? '').trim() ||
    ''
  return top
}
