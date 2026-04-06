import { NextResponse } from 'next/server'
import { readdirSync } from 'fs'
import { join } from 'path'

const BRANDS_DIR = join(process.cwd(), 'public', 'brands')
const IMAGE_EXT = /\.(png|jpg|jpeg|webp|svg)$/i

/**
 * GET /api/brands/logos
 * Returns filenames of brand logos in public/brands for dynamic brand merging.
 */
export async function GET() {
  try {
    const files = readdirSync(BRANDS_DIR)
    const logos = files.filter((f) => IMAGE_EXT.test(f))
    return NextResponse.json({ logos })
  } catch {
    return NextResponse.json({ logos: [] })
  }
}
