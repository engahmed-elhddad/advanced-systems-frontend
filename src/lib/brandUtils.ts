/**
 * Generate the brand page href from brand name and optional slug.
 */
export function getBrandHref(brand: { name?: string; slug?: string }): string {
  if (brand.slug) return `/brands/${encodeURIComponent(brand.slug)}`
  const name = brand.name || ''
  const slug = name.toLowerCase().replace(/\s+/g, '-')
  return slug ? `/brands/${encodeURIComponent(slug)}` : '/brands'
}
