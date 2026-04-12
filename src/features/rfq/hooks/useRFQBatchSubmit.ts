import { useMutation } from '@tanstack/react-query'
import * as rfqService from '@/features/rfq/services/rfqService'
import type { BatchRFQInput } from '@/features/rfq/services/rfqService'

export function useRFQBatchSubmit() {
  const mutation = useMutation({
    mutationFn: (data: BatchRFQInput) => rfqService.submitBatchRFQ(data),
  })

  return {
    submit: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  }
}
