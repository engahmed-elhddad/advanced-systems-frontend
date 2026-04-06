import { NextResponse } from 'next/server'

// 1x1 transparent PNG; served at /images/placeholder.png
const PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Zx9kAAAAASUVORK5CYII='

export async function GET() {
  const body = Buffer.from(PLACEHOLDER_PNG_BASE64, 'base64')
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
