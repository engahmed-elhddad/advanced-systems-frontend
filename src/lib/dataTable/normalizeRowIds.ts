/**
 * Row id normalization for DataTable — strict vs lenient, duplicate handling, optional hash synthetics.
 */
/* eslint-disable no-console -- structured diagnostics */

export type NormalizeRowIdsOptions = {
  tableId?: string
  /**
   * When true, invalid/duplicate rows may receive a deterministic hash id (seed includes tableId + index).
   * When false, duplicates after the first occurrence are skipped with an explicit warning; invalid ids use a non-hash fallback id so rows are never dropped for invalid ids alone.
   */
  allowSyntheticRowIds?: boolean
}

export type NormalizeRowIdsResult<TData> = {
  data: TData[]
  getRowIdForTable: (row: unknown, index: number) => string
  /** Duplicate rows skipped (keep-first policy) when allowSyntheticRowIds is false */
  skippedDuplicateRows: number
  stats: {
    totalInputRows: number
    invalidRecoveredCount: number
    duplicateRowsSkipped: number
    duplicateRowsHashed: number
  }
}

function logRowId(
  tableId: string | undefined,
  code: string,
  detail: Record<string, unknown>,
  level: 'warn' | 'error' = 'warn',
) {
  const label = tableId ? `[DataTable:${tableId}]` : '[DataTable]'
  const payload = { code, tableId: tableId ?? null, ...detail }
  if (process.env.NODE_ENV === 'development') {
    console.groupCollapsed(`${label} rowId → ${code}`)
    console.warn(payload)
    console.groupEnd()
  } else if (level === 'error') {
    console.error(label, payload)
  } else {
    console.warn(label, payload)
  }
}

/** FNV-1a 32-bit — hash synthetic ids only when allowSyntheticRowIds */
function hashSyntheticSeed(seed: string): string {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `__h_${(h >>> 0).toString(16)}`
}

function devRowSummary(
  tableId: string | undefined,
  stats: {
    totalInputRows: number
    invalidRecoveredCount: number
    duplicateRowsSkipped: number
    duplicateRowsHashed: number
  },
  outputLen: number,
) {
  if (process.env.NODE_ENV !== 'development') return
  const label = tableId ? `[DataTable:${tableId}]` : '[DataTable]'
  console.groupCollapsed(`${label} rowId → summary`)
  console.warn({
    totalRows: stats.totalInputRows,
    invalidIdsRecovered: stats.invalidRecoveredCount,
    duplicateIdsSkippedRows: stats.duplicateRowsSkipped,
    duplicateIdsHashedRows: stats.duplicateRowsHashed,
    outputRows: outputLen,
  })
  console.groupEnd()
}

/**
 * @param strict - `true`: throw on invalid/duplicate. `false`: recover per options.
 */
export function normalizeRowIdsForTable<TData>(
  data: TData[],
  getRowId: (row: TData) => string,
  strict: boolean,
  options: NormalizeRowIdsOptions = {},
): NormalizeRowIdsResult<TData> {
  const { tableId, allowSyntheticRowIds = false } = options

  const outData: TData[] = []
  const ids: string[] = []
  const seen = new Set<string>()
  let skippedDuplicateRows = 0
  let invalidRecoveredCount = 0
  let duplicateRowsHashed = 0

  const statsBase = () => ({
    totalInputRows: data.length,
    invalidRecoveredCount,
    duplicateRowsSkipped: skippedDuplicateRows,
    duplicateRowsHashed,
  })

  for (let index = 0; index < data.length; index++) {
    const row = data[index]
    let raw: string

    try {
      raw = getRowId(row)
    } catch (e) {
      const detail = {
        index,
        message: e instanceof Error ? e.message : String(e),
      }
      if (strict) {
        throw new Error(
          `${tableId ? `[DataTable:${tableId}] ` : ''}getRowId threw at index ${index}: ${detail.message}`,
        )
      }
      logRowId(tableId, 'getRowId_threw', detail)
      invalidRecoveredCount += 1
      const seed = `${tableId ?? ''}|${index}|throw`
      raw = allowSyntheticRowIds ? hashSyntheticSeed(seed) : `__err_${(tableId ?? 't').replace(/\W/g, '_')}_${index}`
    }

    if (raw == null || typeof raw !== 'string') {
      if (strict) {
        throw new Error(
          `${tableId ? `[DataTable:${tableId}] ` : ''}getRowId must return string at index ${index}.`,
        )
      }
      logRowId(tableId, 'invalid_type', { index, typeofRaw: typeof raw })
      invalidRecoveredCount += 1
      const seed = `${tableId ?? ''}|${index}|type`
      raw = allowSyntheticRowIds ? hashSyntheticSeed(seed) : `__bad_${(tableId ?? 't').replace(/\W/g, '_')}_${index}`
    }

    let id = raw.trim()
    if (!id) {
      if (strict) {
        throw new Error(`${tableId ? `[DataTable:${tableId}] ` : ''}Empty row id at index ${index}.`)
      }
      logRowId(tableId, 'empty_id', { index })
      invalidRecoveredCount += 1
      const seed = `${tableId ?? ''}|${index}|empty`
      id = allowSyntheticRowIds ? hashSyntheticSeed(seed) : `__empty_${(tableId ?? 't').replace(/\W/g, '_')}_${index}`
    }

    if (seen.has(id)) {
      if (strict) {
        throw new Error(
          `${tableId ? `[DataTable:${tableId}] ` : ''}Duplicate row id "${id}" at index ${index}.`,
        )
      }
      if (allowSyntheticRowIds) {
        const seed = `${tableId ?? ''}|${index}|dup|${id}`
        const newId = hashSyntheticSeed(seed)
        duplicateRowsHashed += 1
        logRowId(tableId, 'duplicate_resolved_hash', { index, originalId: id, newId })
        id = newId
      } else {
        skippedDuplicateRows += 1
        logRowId(
          tableId,
          'duplicate_skipped_keep_first',
          {
            index,
            id,
            message:
              'Duplicate row id: keeping the first occurrence only. This row is omitted from the table data. Fix upstream ids or set allowSyntheticRowIds for hash disambiguation.',
          },
          'warn',
        )
        continue
      }
    }

    seen.add(id)
    outData.push(row)
    ids.push(id)
  }

  const stats = statsBase()
  devRowSummary(tableId, stats, outData.length)

  if (skippedDuplicateRows > 0) {
    logRowId(
      tableId,
      'normalization_summary',
      {
        skippedDuplicateRows,
        keptRows: outData.length,
        message: `${skippedDuplicateRows} duplicate row(s) omitted (keep-first policy).`,
      },
      'warn',
    )
  }

  return {
    data: outData,
    getRowIdForTable: (_row: unknown, index: number) => {
      const rid = ids[index]
      if (rid == null) {
        throw new Error(
          `${tableId ? `[DataTable:${tableId}] ` : ''}Internal row id missing at index ${index}.`,
        )
      }
      return rid
    },
    skippedDuplicateRows,
    stats,
  }
}
