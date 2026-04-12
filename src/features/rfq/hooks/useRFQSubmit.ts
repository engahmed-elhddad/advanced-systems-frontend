import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as rfqService from '@/features/rfq/services/rfqService'
import type { RFQCreateInput } from '@/types/rfq'
import { trackRfqSubmit } from '@/lib/analytics'

export function useRFQSubmit(options?: {
  successToast?: boolean
  errorToast?: boolean
  /** Passed to analytics (e.g. product_page, embedded_rfq_form, rfq_page). */
  analyticsSource?: string
  analyticsEnabled?: boolean
}) {
  const showSuccess = options?.successToast !== false
  const showError = options?.errorToast !== false
  const analyticsEnabled = options?.analyticsEnabled !== false
  const analyticsSource = options?.analyticsSource ?? 'rfq_mutation'
  const mutation = useMutation({
    mutationFn: (data: RFQCreateInput) => rfqService.submitRFQ(data),
    onSuccess: (data, variables) => {
      if (analyticsEnabled) {
        trackRfqSubmit({
          source: analyticsSource,
          part_number: variables.part_number,
          reference: data.reference,
          quantity: variables.quantity,
          product_id: variables.product_id,
        })
      }
      if (showSuccess) toast.success('RFQ submitted — we’ll be in touch shortly.')
    },
    onError: (err: unknown) => {
      if (!showError) return
      const msg = err instanceof Error ? err.message : 'Could not submit RFQ'
      toast.error(msg)
    },
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
