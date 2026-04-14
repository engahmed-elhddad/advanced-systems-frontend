export type DataTableErrorKind = 'config' | 'data' | 'runtime'

/**
 * Rough classification for error-boundary UX (no stack inspection in production UI).
 */
export function classifyTableError(error: Error): DataTableErrorKind {
  const msg = (error.message || '').toLowerCase()
  const name = (error.name || '').toLowerCase()

  if (
    msg.includes('manualpagination') ||
    msg.includes('manualsorting') ||
    msg.includes('manualfiltering') ||
    msg.includes('requires ') ||
    msg.includes('totalrowcount') ||
    msg.includes('pagination') ||
    msg.includes('getrowid is required') ||
    msg.includes('invariant')
  ) {
    return 'config'
  }

  if (
    msg.includes('row id') ||
    msg.includes('duplicate') ||
    msg.includes('invalid') ||
    msg.includes('data') ||
    name.includes('type')
  ) {
    return 'data'
  }

  return 'runtime'
}
