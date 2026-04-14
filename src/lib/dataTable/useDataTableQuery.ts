'use client'

import { keepPreviousData, useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query'

type DataTableQueryOptions<TQueryFnData, TError> = Omit<
  UseQueryOptions<TQueryFnData, TError, TQueryFnData, readonly unknown[]>,
  'queryKey' | 'queryFn' | 'placeholderData'
> & {
  queryKey: readonly unknown[]
  queryFn: (ctx: { signal: AbortSignal }) => Promise<TQueryFnData>
}

/**
 * TanStack Query wrapper for grid data: passes AbortSignal for cancellation,
 * keeps previous page visible while fetching, shared staleTime default.
 */
export function useDataTableQuery<TQueryFnData, TError = Error>(
  options: DataTableQueryOptions<TQueryFnData, TError>,
): UseQueryResult<TQueryFnData, TError> {
  const { queryKey, queryFn, staleTime = 30_000, ...rest } = options
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => queryFn({ signal }),
    staleTime,
    placeholderData: keepPreviousData,
    ...rest,
  })
}
