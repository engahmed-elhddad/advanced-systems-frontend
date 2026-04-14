'use client'

import { Select, type SelectProps } from '@/components/ui/Select'

export type FormSelectProps = SelectProps

/** Consistent wrapper around `Select` for forms (same props; use with `FormField` when you want split label/error). */
export function FormSelect(props: FormSelectProps) {
  return <Select {...props} />
}
