'use client'

import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'

/**
 * Debounces search/filter values before they drive server queries or heavy table updates.
 * Default 300ms — pair with `manualFiltering` / URL sync on the parent.
 *
 * @example
 * const debouncedQ = useDebouncedTableInput(searchInput)
 * const query = useQuery({ queryKey: ['rows', debouncedQ], ... })
 */
export function useDebouncedTableInput<T>(value: T, delayMs = 300): T {
  return useDebouncedValue(value, delayMs)
}
