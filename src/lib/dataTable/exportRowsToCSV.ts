/**
 * CSV export helpers for DataTable and admin tooling.
 */
/* eslint-disable no-console -- large-export diagnostic */

export const CSV_EXPORT_WARN_ROW_LIMIT = 10_000

export type CsvExportColumn<T> = {
  id: string
  header: string
  value: (row: T) => string | number | boolean | null | undefined
}

/** RFC-style escaping: quotes, commas, CR/LF, tabs */
function csvEscape(value: string): string {
  const s = String(value)
  if (/[",\n\r\t]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * Build CSV text from rows and column definitions (header row + one row per item).
 */
export function buildCsvContent<T>(rows: T[], columns: CsvExportColumn<T>[]): string {
  const headerLine = columns.map((c) => csvEscape(c.header)).join(',')
  const body = rows.map((row) =>
    columns.map((c) => csvEscape(String(c.value(row) ?? ''))).join(','),
  )
  return [headerLine, ...body].join('\n')
}

/**
 * Trigger a browser download of a CSV file.
 */
export function exportRowsToCSV<T>(
  rows: T[],
  columns: CsvExportColumn<T>[],
  filename = 'export.csv',
  options?: { warnAboveRows?: number },
): void {
  if (typeof window === 'undefined') return
  const limit = options?.warnAboveRows ?? CSV_EXPORT_WARN_ROW_LIMIT
  if (rows.length > limit) {
    console.warn(
      `[exportRowsToCSV] Exporting ${rows.length} rows (>${limit}). Consider server-side export for very large datasets.`,
    )
  }
  const content = buildCsvContent(rows, columns)
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.replace(/[^\w.\-]+/g, '_')
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
