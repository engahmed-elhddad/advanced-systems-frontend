import { NextRequest, NextResponse } from "next/server"
import { detectPartNumberInfo } from "@/app/lib/partNumberIntelligence"

/**
 * GET /api/intelligence/[part_number]
 *
 * Returns the detected brand, series, and category for an industrial part
 * number using the Part Number Intelligence Engine.
 *
 * Response (pattern matched):
 * {
 *   "brand": "Siemens",
 *   "series": "S7-300/400",
 *   "category": "PLC CPU",
 *   "normalized": "6ES7315-2EH14-0AB0",
 *   "matched_prefix": "6ES7",
 *   "confidence": "high"
 * }
 *
 * Response (no match):
 * {
 *   "brand": null,
 *   "series": null,
 *   "category": null,
 *   "normalized": "UNKNOWNPART",
 *   "matched_prefix": null,
 *   "confidence": "none"
 * }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ part_number: string }> }
) {
  const { part_number } = await params
  const raw = decodeURIComponent(part_number ?? "").trim()

  if (!raw) {
    return NextResponse.json(
      { error: "part_number is required" },
      { status: 400 }
    )
  }

  const result = detectPartNumberInfo(raw)

  return NextResponse.json({
    brand: result.brand,
    series: result.series,
    category: result.category,
    normalized: result.normalized,
    matched_prefix: result.matchedPrefix,
    confidence: result.confidence,
  })
}
