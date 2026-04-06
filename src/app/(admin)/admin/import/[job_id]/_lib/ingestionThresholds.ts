/**
 * Single source of truth for all ingestion validation thresholds.
 * All severity logic lives here — no business rules inside components.
 */

export type Severity = 'green' | 'amber' | 'red'

// ── Threshold config ──────────────────────────────────────────────────────────

interface Threshold {
  green: number  // value >= green → green
  amber: number  // value >= amber && < green → amber; < amber → red
}

interface InvertedThreshold {
  green: number  // value <= green → green (lower is better)
  amber: number  // value <= amber && > green → amber; > amber → red
}

export const THRESHOLDS = {
  quality_score:            { green: 0.85, amber: 0.65 } satisfies Threshold,
  valid_rate:               { green: 0.95, amber: 0.80 } satisfies Threshold,
  brand_resolution_rate:    { green: 0.90, amber: 0.75 } satisfies Threshold,
  category_resolution_rate: { green: 0.90, amber: 0.75 } satisfies Threshold,
  description_coverage:     { green: 0.80, amber: 0.60 } satisfies Threshold,
  duplicate_rate:           { green: 0.02, amber: 0.10 } satisfies InvertedThreshold,
}

// ── Core helpers ──────────────────────────────────────────────────────────────

/** Higher is better (valid rate, quality score, resolution rates). */
export function getSeverity(
  metric: keyof Omit<typeof THRESHOLDS, 'duplicate_rate'>,
  value: number,
): Severity {
  const t = THRESHOLDS[metric]
  if (value >= t.green) return 'green'
  if (value >= t.amber) return 'amber'
  return 'red'
}

/** Lower is better (duplicate rate). */
export function getSeverityInverted(value: number): Severity {
  const t = THRESHOLDS.duplicate_rate
  if (value <= t.green) return 'green'
  if (value <= t.amber) return 'amber'
  return 'red'
}

// ── Verdict helpers ───────────────────────────────────────────────────────────

export type VerdictSeverity = 'green' | 'amber' | 'red'

/**
 * Go/no-go signal for the operator.
 * Red if quality < 0.65 OR invalid rate > 20%.
 * Amber if quality < 0.85 OR invalid rate > 5%.
 * Green otherwise.
 */
export function getVerdictSeverity(
  qualityScore: number,
  invalidRate: number,
): VerdictSeverity {
  if (qualityScore < 0.65 || invalidRate > 0.20) return 'red'
  if (qualityScore < 0.85 || invalidRate > 0.05) return 'amber'
  return 'green'
}

export function getVerdictLabel(severity: VerdictSeverity): string {
  if (severity === 'green') return 'Ready to Approve'
  if (severity === 'amber') return 'Review Required'
  return 'Do Not Publish'
}

export function getVerdictDescription(severity: VerdictSeverity): string {
  if (severity === 'green') return 'Validation passed. You can safely approve valid rows.'
  if (severity === 'amber') return 'Some rows need attention before publishing.'
  return 'Error rate or quality score is too low to publish safely.'
}

// ── Tailwind class maps (single definition, used by all components) ───────────

export const SEVERITY_TEXT: Record<Severity, string> = {
  green: 'text-emerald-700',
  amber: 'text-amber-700',
  red:   'text-red-700',
}

export const SEVERITY_BG: Record<Severity, string> = {
  green: 'bg-emerald-50',
  amber: 'bg-amber-50',
  red:   'bg-red-50',
}

export const SEVERITY_BORDER: Record<Severity, string> = {
  green: 'border-emerald-200',
  amber: 'border-amber-200',
  red:   'border-red-200',
}

export const SEVERITY_BAR: Record<Severity, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-400',
  red:   'bg-red-500',
}
