export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000"

export const CONTACT_EMAIL = "eng.ahmed@advancedsystems-int.com"

export const WHATSAPP_NUMBER = "201000629229"

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

/** Normalize a part number by removing spaces and dashes for consistent search/navigation.
 *  e.g. "6GK7443 1EX11" and "6GK7443-1EX11" both become "6GK74431EX11". */
export function normalizePartNumber(part: string): string {
  return part.trim().replace(/[\s-]+/g, "").toUpperCase()
}

/**
 * Resolve the best available image URL for a product.
 *
 * Priority order:
 *  1. p.images[0]  – first image in the images array (legacy / enriched data)
 *  2. p.image      – singular image field written by the image-enrichment service
 *  3. Constructed path: <api>/uploads/products/<part_number>.jpg
 *
 * For relative paths the function handles all storage conventions:
 *  • "/uploads/…"   → prepend api base
 *  • "uploads/…"    → prepend api base + "/"
 *  • "/products/…"  → keep as-is (public folder)
 *  • bare filename  → treat as uploads/products/<filename>
 */
export function resolveProductImageUrl(
  p: { part_number?: string; images?: string[]; image?: string },
  api: string
): string {
  const rawImg: string | null =
    (p.images && p.images.length > 0 ? p.images[0] : null) ?? p.image ?? null
  if (typeof rawImg === "string" && rawImg) {
    if (rawImg.startsWith("http")) return rawImg
    if (rawImg.startsWith("/uploads/")) return `${api}${rawImg}`
    if (rawImg.startsWith("uploads/")) return `${api}/${rawImg}`
    if (rawImg.startsWith("/products/")) return rawImg
    // Bare filename (e.g. "PART.jpg") stored by image-enrichment service
    return `${api}/uploads/products/${rawImg}`
  }
  if (p.part_number) {
    return `${api}/uploads/products/${p.part_number}.jpg`
  }
  return "/products/no-product-image.jpg"
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
