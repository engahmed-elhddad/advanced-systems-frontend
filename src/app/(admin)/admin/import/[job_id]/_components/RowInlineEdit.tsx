'use client'

import { useCallback, useState } from 'react'
import { Loader2, Save, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StagedRow } from '@/services/adminService'
import type { EditRowPayload } from '../_hooks/useJobDashboard'

interface Props {
  row: StagedRow
  isSaving: boolean
  onSave: (payload: EditRowPayload) => void
  onCancel: () => void
}

interface FormState {
  part_number: string
  brand: string
  category: string
  stock_quantity: string
  description: string
}

interface FieldConfig {
  key: keyof FormState
  label: string
  type: 'text' | 'number' | 'textarea'
}

const FIELDS: FieldConfig[] = [
  { key: 'part_number',    label: 'Part Number',    type: 'text' },
  { key: 'brand',          label: 'Brand',          type: 'text' },
  { key: 'category',       label: 'Category',       type: 'text' },
  { key: 'stock_quantity', label: 'Stock Quantity',  type: 'number' },
  { key: 'description',    label: 'Description',    type: 'textarea' },
]

function initFormState(row: StagedRow): FormState {
  return {
    part_number:    row.part_number ?? '',
    brand:          row.brand_raw ?? '',
    category:       row.category_raw ?? '',
    stock_quantity: row.stock_quantity?.toString() ?? '0',
    description:    row.description ?? '',
  }
}

function buildPayload(rowId: number, form: FormState): EditRowPayload {
  const stockNum = parseInt(form.stock_quantity, 10)
  return {
    rowId,
    data: {
      part_number:    form.part_number.trim() || undefined,
      brand:          form.brand.trim() || undefined,
      category:       form.category.trim() || undefined,
      stock_quantity: Number.isFinite(stockNum) ? stockNum : undefined,
      description:    form.description.trim() || undefined,
    },
  }
}

function getFieldErrors(
  fieldKey: keyof FormState,
  validationErrors: StagedRow['validation_errors'],
): string | null {
  const fieldMap: Record<keyof FormState, string> = {
    part_number: 'part_number',
    brand: 'brand',
    category: 'category',
    stock_quantity: 'stock_quantity',
    description: 'description',
  }
  const mapped = fieldMap[fieldKey]
  const match = validationErrors.find((e) => e.field === mapped)
  return match?.error ?? null
}

export function RowInlineEdit({ row, isSaving, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(() => initFormState(row))

  const updateField = useCallback(
    (key: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleSave = () => {
    onSave(buildPayload(row.id, form))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div
      className="border-t border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3"
      onKeyDown={handleKeyDown}
    >
      {/* Validation errors summary (from backend, if any) */}
      {row.validation_errors.length > 0 && (
        <div className="mb-3 rounded-[2px] border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700">
            Validation Errors
          </p>
          <ul className="mt-1 space-y-0.5">
            {row.validation_errors.map((err, i) => (
              <li key={i} className="text-xs text-red-700">
                <span className="font-medium">{err.field}</span>: {err.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Editable fields */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((field) => {
          const fieldError = getFieldErrors(field.key, row.validation_errors)
          const hasError = fieldError !== null

          return (
            <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2 lg:col-span-3' : ''}>
              <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={form[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  disabled={isSaving}
                  rows={2}
                  className={cn(
                    'w-full resize-none rounded-[2px] border px-3 py-1.5 text-xs text-[#1A1A1A]',
                    'focus:border-[#0072CE] focus:outline-none focus:ring-1 focus:ring-[#0072CE]/20',
                    'disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]',
                    hasError ? 'border-red-400' : 'border-[#E5E7EB]',
                  )}
                />
              ) : (
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  disabled={isSaving}
                  className={cn(
                    'h-8 w-full rounded-[2px] border px-3 text-xs text-[#1A1A1A]',
                    'focus:border-[#0072CE] focus:outline-none focus:ring-1 focus:ring-[#0072CE]/20',
                    'disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]',
                    field.key === 'part_number' && 'font-mono',
                    hasError ? 'border-red-400' : 'border-[#E5E7EB]',
                  )}
                />
              )}
              {hasError && (
                <p className="mt-0.5 text-[11px] text-red-600">{fieldError}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-[#9CA3AF]">
          Ctrl+Enter to save · Esc to cancel
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className={cn(
              'inline-flex items-center gap-1 rounded-[2px] px-3 py-1.5 text-xs font-medium text-[#6B7280]',
              'transition-colors hover:bg-[#F3F4F6] hover:text-[#1A1A1A]',
              'focus:outline-none focus:ring-2 focus:ring-[#0072CE]/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'inline-flex items-center gap-1 rounded-[2px] bg-[#0072CE] px-3 py-1.5 text-xs font-medium text-white',
              'transition-colors hover:bg-[#005BA4]',
              'focus:outline-none focus:ring-2 focus:ring-[#0072CE]/30',
              'disabled:cursor-not-allowed disabled:opacity-70',
            )}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden />
            )}
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
