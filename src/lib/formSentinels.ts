/** Use in Radix Select when native `<option value="">` was used (empty string not allowed on Radix Item). */
export const SELECT_EMPTY = '__none__'

export function emptyToSentinel(v: string): string {
  return v.trim() === '' ? SELECT_EMPTY : v
}

export function sentinelToEmpty(v: string): string {
  return v === SELECT_EMPTY ? '' : v
}
