export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000"

/** Cloudflare CDN for R2 media (images, datasheets) */
export const CDN_BASE_URL =
  process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.advancedsystems-int.com"

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "eng.ahmed@advancedsystems-int.com"

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201000629229"

/** Site base URL for SEO canonical, OpenGraph, sitemap */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://advancedsystems-int.com"

export function rfqMailtoHref(partNumber: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=RFQ%20${encodeURIComponent(partNumber)}`
}

export function whatsappHref(partNumber: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20Advanced%20Systems,%20I%20would%20like%20to%20ask%20about%20${encodeURIComponent(partNumber)}`
}

export const CATEGORIES = [
  { name: "PLC", slug: "plc", icon: "🔲", description: "Programmable Logic Controllers for automation control" },
  { name: "Drives", slug: "drives", icon: "⚡", description: "Variable frequency & servo drives for motor control" },
  { name: "HMI", slug: "hmi", icon: "🖥️", description: "Human machine interface panels & touchscreens" },
  { name: "Sensors", slug: "sensors", icon: "📡", description: "Industrial proximity, vision & process sensors" },
  { name: "Power Supply", slug: "power-supply", icon: "🔌", description: "24V DC industrial DIN-rail power supplies" },
  { name: "Safety Relay", slug: "safety-relay", icon: "🛡️", description: "Safety monitoring relays & emergency stop modules" },
  { name: "Soft Starters", slug: "soft-starters", icon: "🔄", description: "Soft start controllers for smooth motor startup" },
  { name: "Servo", slug: "servo", icon: "⚙️", description: "Servo motors, drives & positioning systems" },
]

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name)

/** Convert a URL slug to the display category name, e.g. "safety-relay" → "Safety Relay" */
export function slugToCategory(slug: string): string | undefined {
  if (!slug) return undefined
  const lower = slug.toLowerCase()
  return CATEGORIES.find((c) => c.slug === lower)?.name
}

/** Convert a display category name to its URL slug, e.g. "Safety Relay" → "safety-relay".
 *  Falls back to a generated slug for categories not in the built-in list (e.g. from API). */
export function categoryToSlug(name: string): string {
  if (!name) return ""
  const lower = name.toLowerCase()
  return CATEGORIES.find((c) => c.name.toLowerCase() === lower)?.slug
    ?? lower.replace(/\s+/g, "-")
}

/** Convert series name to URL slug, e.g. "TeSys" → "tesys", "LC1D" → "lc1d" */
export function seriesToSlug(series: string): string {
  if (!series) return ""
  return series.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, "")
}

/** Convert spec key-value to URL slug, e.g. { key: "current", value: "9A" } → "current-9a" */
export function specToSlug(key: string, value: string): string {
  if (!key) return ""
  const k = key.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, "")
  const v = (value || "").toString().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, "")
  return v ? `${k}-${v}` : k
}

/** Parse spec slug to key/value, e.g. "current-9a" → { key: "current", value: "9a" } */
export function slugToSpec(slug: string): { key: string; value: string } {
  if (!slug) return { key: "", value: "" }
  const parts = slug.split("-")
  if (parts.length < 2) return { key: slug, value: "" }
  const value = parts.pop() || ""
  const key = parts.join("-")
  return { key, value }
}

/** Normalize a part number by removing spaces and dashes for consistent search/navigation.
 *  e.g. "6GK7443 1EX11" and "6GK7443-1EX11" both become "6GK74431EX11". */
export function normalizePartNumber(part: string): string {
  return part.trim().replace(/[\s-]+/g, "").toUpperCase()
}

/** Canonical placeholder when no product image is available. Use everywhere for consistency. */
export const PRODUCT_PLACEHOLDER_IMAGE = "/images/product-placeholder.png"

/**
 * Robust product image resolver – images always render without breaking layout.
 * Priority:
 *  1. product.image_url (or images[0] / image) when present – use as-is (full URL or API-relative)
 *  2. Else: /uploads/products/{part_number}.jpg (backend may serve from uploads)
 *  3. Else: /images/product-placeholder.png
 */
export function resolveProductImageUrl(
  p: { part_number?: string; images?: string[]; image?: string; image_url?: string },
  api: string
): string {
  const rawImg: string | null =
    (p.images && p.images.length > 0 ? p.images[0] : null) ?? p.image_url ?? p.image ?? null
  if (typeof rawImg === "string" && rawImg.trim()) {
    const s = rawImg.trim()
    if (s.startsWith("http")) return s
    if (s.startsWith("/uploads/")) return `${api}${s}`
    if (s.startsWith("uploads/")) return `${api}/${s}`
    if (s.startsWith("/")) return s
    return `${api}/uploads/products/${s}`
  }
  if (p.part_number && typeof p.part_number === "string" && p.part_number.trim()) {
    const part = p.part_number.trim().replace(/\s+/g, "-")
    return `${api}/uploads/products/${part}.jpg`
  }
  return PRODUCT_PLACEHOLDER_IMAGE
}

export const FEATURED_BRANDS: { name: string; slug: string; logo: string }[] = [
  { name: "Siemens",            slug: "siemens",         logo: "/brands/siemens.png"         },
  { name: "Schneider Electric", slug: "schneider",       logo: "/brands/schneider.png"       },
  { name: "Omron",              slug: "omron",           logo: "/brands/omron.png"           },
  { name: "Mitsubishi",         slug: "mitsubishi",      logo: "/brands/mitsubishi.png"      },
  { name: "SICK",               slug: "sick",            logo: "/brands/sick.png"            },
  { name: "IFM",                slug: "ifm",             logo: "/brands/ifm.png"             },
  { name: "Pilz",               slug: "pilz",            logo: "/brands/pilz.png"            },
  { name: "Balluff",            slug: "balluff",         logo: "/brands/balluff.png"         },
  { name: "Wago",               slug: "wago",            logo: "/brands/wago.png"            },
  { name: "Eaton",              slug: "eaton",           logo: "/brands/eaton.png"           },
]

/** Map display brand name to its URL slug (used for brand pages and logo filenames) */
export const BRAND_SLUG_MAP: Record<string, string> = {
  "Siemens": "siemens",
  "Schneider Electric": "schneider",
  "ABB": "abb",
  "Omron": "omron",
  "Mitsubishi": "mitsubishi",
  "SICK": "sick",
  "IFM": "ifm",
  "Pilz": "pilz",
  "Balluff": "balluff",
  "Delta": "delta",
  "Wago": "wago",
  "KEB": "keb",
  "Eaton": "eaton",
  "Lenze": "lenze",
  "Parker": "parker",
  "Phoenix Contact": "phoenix-contact",
  "Endress+Hauser": "endress-hauser",
  "Allen-Bradley": "allen-bradley",
  "B&R": "b-and-r",
  "Telemecanique": "telemecanique",
}
