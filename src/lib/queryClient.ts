import { QueryClient } from '@tanstack/react-query'

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false
  const status = (error as { response?: { status?: number } })?.response?.status
  if (status != null && status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return false
  }
  return true
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: { retry: 0 },
  },
})
