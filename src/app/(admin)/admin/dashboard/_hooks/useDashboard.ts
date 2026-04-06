import { useQuery } from '@tanstack/react-query'
import { getB2BDashboard } from '@/services/adminService'
import type { B2BDashboardResponse } from '@/services/adminService'

export function useDashboard() {
  const { data, isLoading, isError, refetch } = useQuery<B2BDashboardResponse>({
    queryKey: ['b2b-dashboard'],
    queryFn: getB2BDashboard,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 2,
  })

  return { data, isLoading, isError, refetch }
}
