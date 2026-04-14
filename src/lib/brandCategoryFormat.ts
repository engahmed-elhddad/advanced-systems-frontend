/** Match backend `normalize_brand_name` / `normalize_category_name` for preview & auto-format. */

export function formatBrandNameInput(raw: string): string {
  const t = raw.trim()
  if (!t) return ""
  return t.toUpperCase()
}

export function formatCategoryNameInput(raw: string): string {
  const t = raw.trim().replace(/\s+/g, " ")
  if (!t) return ""
  return t
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ")
}
