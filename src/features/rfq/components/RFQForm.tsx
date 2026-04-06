'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { rfqSchema } from '@/lib/validators'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useRFQ } from '@/features/rfq/hooks/useRFQ'
import { ValidationError } from '@/types/api'
import { RFQ_DEFAULT_COUNTRY } from '@/lib/constants'

type FormValues = z.input<typeof rfqSchema>

export function RFQForm() {
  const mutation = useRFQ()
  const [ref, setRef] = useState<string | null>(null)
  const [apiErr, setApiErr] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(rfqSchema),
    mode: 'onBlur',
    defaultValues: {
      part_number: '',
      quantity: 1,
      email: '',
      company: '',
      message: '',
      contact_name: 'Customer',
      country: 'Egypt',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setApiErr(null)
    try {
      const res = await mutation.mutateAsync({
        part_number: values.part_number,
        quantity: values.quantity,
        email: values.email,
        company: values.company,
        contact_name: values.contact_name ?? 'Customer',
        country: values.country ?? RFQ_DEFAULT_COUNTRY,
        message: values.message || undefined,
      })
      setRef(res.reference)
      reset()
    } catch (e) {
      if (e instanceof ValidationError) {
        for (const [k, msgs] of Object.entries(e.fields)) {
          const key = k as keyof FormValues
          setError(key, { message: msgs[0] ?? 'Invalid' })
        }
        setApiErr('Please fix the highlighted fields.')
      } else {
        setApiErr(e instanceof Error ? e.message : 'Submission failed')
      }
    }
  })

  return (
    <form className="mx-auto max-w-xl space-y-4" onSubmit={onSubmit} noValidate>
      <Input
        label="Part number"
        id="part_number"
        error={errors.part_number?.message}
        {...register('part_number')}
        required
      />
      <Input
        label="Quantity"
        id="quantity"
        type="number"
        error={errors.quantity?.message}
        {...register('quantity', { valueAsNumber: true })}
        required
      />
      <Input label="Email" id="email" type="email" error={errors.email?.message} {...register('email')} required />
      <Input label="Company" id="company" error={errors.company?.message} {...register('company')} placeholder="Optional" />
      {apiErr ? (
        <p className="text-sm text-[var(--color-destructive)]" role="alert">
          {apiErr}
        </p>
      ) : null}
      <Button type="submit" disabled={!isValid} loading={mutation.isPending}>
        {mutation.isPending ? 'Submitting...' : 'Get Price in 2 Hours'}
      </Button>
      <p className="text-[10px] text-[#6B7280] text-center">
        Typical response: 2–4 hours &middot; No commitment required
      </p>

      <Modal
        open={Boolean(ref)}
        onClose={() => setRef(null)}
        title="RFQ received"
        size="sm"
        footer={
          <Button type="button" variant="secondary" onClick={() => setRef(null)}>
            Close
          </Button>
        }
      >
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Reference: <span className="font-mono font-semibold text-[var(--color-foreground)]">{ref}</span>
        </p>
      </Modal>
    </form>
  )
}
