import { NextRequest, NextResponse } from "next/server"

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

// Use environment variable for admin key; fall back to default only when not set
const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? "ADVANCED_SYSTEMS_ADMIN"

const BOT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; AdvancedSystemsBot/1.0; +https://advancedsystems-int.com)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Extract the Open Graph image URL from an HTML string, or return null. */
function extractOgImage(html: string): string | null {
  const m =
    html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) ||
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/)
  return m ? m[1] : null
}

/**
 * Extracts a product image URL from the page HTML.
 * Tries multiple common patterns (WooCommerce, og:image, etc.)
 */
function extractImageFromHtml(html: string): string | null {
  // 1. WooCommerce product gallery main image
  const wcGalleryMatch = html.match(
    /class="[^"]*woocommerce-product-gallery__image[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"/
  )
  if (wcGalleryMatch) return wcGalleryMatch[1]

  // 2. Open Graph image (most reliable fallback)
  const ogImageMatch = extractOgImage(html)
  if (ogImageMatch) return ogImageMatch

  // 3. WooCommerce product image srcset – pick highest resolution
  const srcsetMatch = html.match(/class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/)
  if (srcsetMatch) return srcsetMatch[1]

  // 4. Twitter card image
  const twitterImageMatch = html.match(
    /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/
  )
  if (twitterImageMatch) return twitterImageMatch[1]

  return null
}

async function fetchHtml(url: string, timeoutMs = 10000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: BOT_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    })
    return res.ok ? res.text() : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Per-distributor crawlers
// Distributor images are preferred over generic thumbnails.
// ---------------------------------------------------------------------------

/**
 * Search RS Components (UK) for a product image.
 * Preferred source – high-quality distributor images.
 */
async function findImageOnRS(partNumber: string): Promise<string | null> {
  const searchUrl = `https://uk.rs-online.com/web/c/?searchTerm=${encodeURIComponent(partNumber)}&redirect-action=search`
  const html = await fetchHtml(searchUrl)
  if (!html) return null

  // Follow the first product link on the search-results page
  const productMatch = html.match(/href="(\/web\/p\/[^"?#]+)"/)
  if (productMatch) {
    const productHtml = await fetchHtml(`https://uk.rs-online.com${productMatch[1]}`)
    if (productHtml) {
      const og = extractOgImage(productHtml)
      if (og) return og
      // RS CDN image
      const cdnMatch = productHtml.match(
        /src="([^"]*media\.rs-online\.com[^"]+\.(?:jpg|jpeg|png|webp))"/
      )
      if (cdnMatch) return cdnMatch[1]
    }
  }

  return extractOgImage(html)
}

/**
 * Search Radwell for a product image.
 * Preferred source – distributor.
 */
async function findImageOnRadwell(partNumber: string): Promise<string | null> {
  const searchUrl = `https://www.radwell.com/en-US/Buy/search/?search_input=${encodeURIComponent(partNumber)}`
  const html = await fetchHtml(searchUrl)
  if (!html) return null

  // Follow the first product link
  const productMatch = html.match(/href="(\/en-US\/Buy\/[^"?#]+\/[^"?#]+\/[^"?#]+)"/)
  if (productMatch) {
    const productHtml = await fetchHtml(`https://www.radwell.com${productMatch[1]}`)
    if (productHtml) {
      const og = extractOgImage(productHtml)
      if (og) return og
      // Radwell uses Cloudinary CDN
      const cdnMatch = productHtml.match(
        /src="([^"]*cloudinary\.com[^"]+\.(?:jpg|jpeg|png|webp))"/
      )
      if (cdnMatch) return cdnMatch[1]
    }
  }

  return extractOgImage(html)
}

/**
 * Search Mouser for a product image.
 * Preferred source – distributor.
 */
async function findImageOnMouser(partNumber: string): Promise<string | null> {
  const searchUrl = `https://www.mouser.com/Search/Refine?Keyword=${encodeURIComponent(partNumber)}`
  const html = await fetchHtml(searchUrl)
  if (!html) return null

  // Follow the first product detail link
  const productMatch = html.match(/href="(\/ProductDetail\/[^"?#]+)"/)
  if (productMatch) {
    const productHtml = await fetchHtml(`https://www.mouser.com${productMatch[1]}`)
    if (productHtml) {
      const og = extractOgImage(productHtml)
      if (og) return og
      const imgMatch = productHtml.match(
        /class="[^"]*product-image[^"]*"[^>]*src="([^"]+)"/
      )
      if (imgMatch) {
        const url = imgMatch[1]
        return url.startsWith("http") ? url : `https://www.mouser.com${url}`
      }
    }
  }

  return extractOgImage(html)
}

/**
 * Searches electech.com.eg for a product image by part number.
 * Returns the image URL if found, or null.
 */
async function findImageOnElectech(partNumber: string): Promise<string | null> {
  const searchUrl = `https://www.electech.com.eg/?s=${encodeURIComponent(partNumber)}&post_type=product`
  const html = await fetchHtml(searchUrl)
  if (!html) return null

  // Try to find a product link from search results (WooCommerce typical structure)
  const productLinkMatch = html.match(
    /href="(https:\/\/www\.electech\.com\.eg\/product\/[^"]+)"/
  )
  if (!productLinkMatch) {
    return extractImageFromHtml(html)
  }

  const productHtml = await fetchHtml(productLinkMatch[1])
  if (!productHtml) return null

  return extractImageFromHtml(productHtml)
}

/**
 * Downloads an image from a URL and returns a Blob.
 */
async function downloadImage(imageUrl: string): Promise<{ blob: Blob; contentType: string } | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AdvancedSystemsBot/1.0; +https://advancedsystems-int.com)",
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const blob = await res.blob()
    const contentType = res.headers.get("content-type") || "image/jpeg"
    return { blob, contentType }
  } catch {
    return null
  }
}

/**
 * Uploads an image to the backend.
 * Returns the image path if successful.
 */
async function uploadImageToBackend(
  blob: Blob,
  partNumber: string,
  contentType: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
    ? "webp"
    : "jpg"
  const filename = `${partNumber}.${ext}`

  const form = new FormData()
  form.append("file", new File([blob], filename, { type: contentType }))
  form.append("part_number", partNumber)

  const res = await fetch(`${API}/admin/upload-image`, {
    method: "POST",
    headers: { "api-key": ADMIN_API_KEY },
    body: form,
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error")
    return { success: false, error: text }
  }

  const data = await res.json().catch(() => ({}))
  return { success: true, path: data?.path || `/uploads/products/${filename}` }
}

export async function POST(req: NextRequest) {
  let body: { part_number?: string; part_numbers?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const partNumbers: string[] = []
  if (body.part_number) partNumbers.push(body.part_number.trim().toUpperCase())
  if (Array.isArray(body.part_numbers)) {
    body.part_numbers.forEach((p) => {
      if (typeof p === "string" && p.trim()) {
        partNumbers.push(p.trim().toUpperCase())
      }
    })
  }

  if (partNumbers.length === 0) {
    return NextResponse.json(
      { error: "Provide part_number or part_numbers array" },
      { status: 400 }
    )
  }

  const results: {
    part_number: string
    status: "found" | "not_found" | "error"
    source?: string
    image_url?: string
    uploaded_path?: string
    message?: string
  }[] = []

  for (const partNumber of partNumbers) {
    try {
      // Try distributors in priority order; prefer distributor images over thumbnails.
      let imageUrl: string | null = null
      let source = "unknown"

      const sources: Array<{ name: string; fn: (p: string) => Promise<string | null> }> = [
        { name: "RS Components", fn: findImageOnRS },
        { name: "Radwell", fn: findImageOnRadwell },
        { name: "Mouser", fn: findImageOnMouser },
        { name: "Electech", fn: findImageOnElectech },
      ]

      for (const { name, fn } of sources) {
        imageUrl = await fn(partNumber)
        if (imageUrl) {
          source = name
          break
        }
      }

      if (!imageUrl) {
        results.push({
          part_number: partNumber,
          status: "not_found",
          message: "No image found on RS Components, Radwell, Mouser, or Electech",
        })
        continue
      }

      const downloaded = await downloadImage(imageUrl)
      if (!downloaded) {
        results.push({ part_number: partNumber, status: "error", image_url: imageUrl, message: "Failed to download image" })
        continue
      }

      const uploaded = await uploadImageToBackend(downloaded.blob, partNumber, downloaded.contentType)
      if (!uploaded.success) {
        results.push({ part_number: partNumber, status: "error", image_url: imageUrl, message: uploaded.error || "Upload failed" })
        continue
      }

      results.push({
        part_number: partNumber,
        source,
        status: "found",
        image_url: imageUrl,
        uploaded_path: uploaded.path,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ part_number: partNumber, status: "error", message })
    }
  }

  return NextResponse.json({ results })
}
