import { useMutation } from '@tanstack/react-query'
import * as rfqService from '@/services/rfqService'
import type { RFQCreateInput } from '@/types/rfq'

export function useRFQSubmit() {
  const mutation = useMutation({
    mutationFn: (data: RFQCreateInput) => rfqService.submitRFQ(data),
  })

  return {
    submit: mutation.mutate,
    submitAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  }
}
