'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { Button, Input, Modal } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api'
import type { AdminWarehouseRow } from '@/lib/admin-api'
import { createAdminWarehouse, updateAdminWarehouse } from '@/lib/admin-api'

const CODE_RE = /^[A-Z]{2,8}$/
const CC_RE = /^[A-Z]{2}$/

type Mode = 'create' | 'edit'

export function WarehouseFormModal(props: {
  open: boolean
  mode: Mode
  initial: AdminWarehouseRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const { open, mode, initial, onClose, onSaved } = props
  const [code, setCode] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [country, setCountry] = useState('')
  const [hs, setHs] = useState('')
  const [lead, setLead] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLocalError(null)
    if (mode === 'edit' && initial) {
      setCode(initial.code)
      setNameEn(initial.name_en)
      setNameAr(initial.name_ar)
      setCountry(initial.country_code)
      setHs(initial.default_hs_code ?? '')
      setLead(initial.default_lead_time_days != null ? String(initial.default_lead_time_days) : '')
    } else {
      setCode('')
      setNameEn('')
      setNameAr('')
      setCountry('')
      setHs('')
      setLead('')
    }
  }, [open, mode, initial])

  const submit = async () => {
    setLocalError(null)
    const name_en = nameEn.trim()
    const name_ar = nameAr.trim()
    const country_code = country.trim().toUpperCase()
    let createCode = ''
    if (mode === 'create') {
      createCode = code.trim().toUpperCase()
      if (!CODE_RE.test(createCode)) {
        setLocalError('Code must be 2–8 uppercase letters.')
        return
      }
    }
    if (!name_en || !name_ar) {
      setLocalError('English and Arabic names are required.')
      return
    }
    if (!CC_RE.test(country_code)) {
      setLocalError('Country must be ISO 3166-1 alpha-2 (e.g. EG).')
      return
    }
    let default_lead_time_days: number | undefined
    if (lead.trim()) {
      const n = Number(lead)
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        setLocalError('Lead time must be a non-negative integer.')
        return
      }
      default_lead_time_days = n
    }
    let default_hs_code: string | undefined
    const hsTrim = hs.trim()
    if (hsTrim) {
      if (hsTrim.length < 4 || hsTrim.length > 20) {
        setLocalError('HS code must be 4–20 characters when provided.')
        return
      }
      default_hs_code = hsTrim
    }

    setSubmitting(true)
    try {
      if (mode === 'create') {
        const body: Record<string, unknown> = {
          code: createCode,
          name_en,
          name_ar,
          country_code,
        }
        if (default_hs_code) body.default_hs_code = default_hs_code
        if (default_lead_time_days != null) body.default_lead_time_days = default_lead_time_days
        const res = await createAdminWarehouse(body)
        if (!res.ok) {
          setLocalError(res.message)
          return
        }
        toast.success('Warehouse created')
      } else if (initial) {
        const body: Record<string, unknown> = {
          name_en,
          name_ar,
          country_code,
          default_hs_code: hsTrim ? hsTrim : null,
          default_lead_time_days: lead.trim() === '' ? null : default_lead_time_days,
        }
        const res = await updateAdminWarehouse(initial.id, body)
        if (!res.ok) {
          setLocalError(res.message)
          return
        }
        toast.success('Warehouse saved')
      }
      onSaved()
      onClose()
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Save failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Add warehouse' : `Edit ${initial?.code ?? ''}`}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={submitting} onClick={() => void submit()}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {localError ? (
          <p className="text-sm text-red-400" role="alert">
            {localError}
          </p>
        ) : null}
        {mode === 'create' ? (
          <Input
            label="Warehouse code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EG"
          />
        ) : null}
        <Input label="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        <Input label="Name (AR)" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
        <Input
          label="Country code"
          value={country}
          onChange={(e) => setCountry(e.target.value.toUpperCase())}
          maxLength={2}
        />
        <Input label="Default HS code (optional)" value={hs} onChange={(e) => setHs(e.target.value)} placeholder="8501.40.00" />
        <Input
          label="Default lead time days (optional)"
          value={lead}
          onChange={(e) => setLead(e.target.value)}
          inputMode="numeric"
        />
      </div>
    </Modal>
  )
}
