import type { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

const base = "https://advancedsystems-int.com"
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000"

/* =========================
GET PRODUCTS
========================= */

let products: any[] = []

try {
  const res = await fetch(`${API_BASE}/api/v1/products/?page=1&size=1000`, {
    next: { revalidate: 3600 },
  })
  const data = await res.json()
  products = data?.items || []

} catch (e) {
  console.log("sitemap products error", e)
}


/* =========================
PRODUCT PAGES
========================= */

const productPages = products.map((p: any) => ({
  url: `${base}/product/${encodeURIComponent(p.part_number || p.slug || String(p.id))}`,

lastModified: new Date(),

changeFrequency: "weekly" as const,

priority: 0.8

}))



/* =========================
GET BRANDS
========================= */

let brands:string[] = []

try {
  const res = await fetch(`${API_BASE}/api/v1/brands/`, { next: { revalidate: 3600 } })
  const data = await res.json()
  brands = Array.isArray(data) ? data.map((b: any) => b.slug || b.name) : data?.brands || []
} catch (e) {
  console.log("sitemap brands error", e)
}


/* =========================
BRAND PAGES
========================= */

const brandPages = brands.map((b: string) => ({
  url: `${base}/brand/${encodeURIComponent(b)}`,

lastModified: new Date(),

changeFrequency: "weekly" as const,

priority: 0.7

}))



/* =========================
STATIC PAGES
========================= */

const staticPages = [

{
url: `${base}`,
lastModified: new Date(),
changeFrequency: "weekly" as const,
priority: 1
},

{
url: `${base}/products`,
lastModified: new Date(),
changeFrequency: "weekly" as const,
priority: 0.9
},

{
  url: `${base}/search`,
  lastModified: new Date(),
  changeFrequency: "daily" as const,
  priority: 0.9,
},
{
  url: `${base}/rfq`,
  lastModified: new Date(),
  changeFrequency: "monthly" as const,
  priority: 0.8,
},
{
  url: `${base}/contact`,
  lastModified: new Date(),
  changeFrequency: "monthly" as const,
  priority: 0.5,
}

]



/* =========================
FINAL SITEMAP
========================= */

return [

...staticPages,

...brandPages,

...productPages

]

}