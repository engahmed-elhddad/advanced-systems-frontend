import { useMutation } from '@tanstack/react-query'
import * as rfqService from '@/services/rfqService'
import type { BatchRFQInput } from '@/services/rfqService'

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
