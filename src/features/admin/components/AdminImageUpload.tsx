'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export interface AdminImageUploadProps {
  onUpload: (file: File) => Promise<void> | void
  disabled?: boolean
}

export function AdminImageUpload({ onUpload, disabled }: AdminImageUploadProps) {
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<File | null>(null)

  return (
    <div className="space-y-3">
      <Input
        type="file"
        accept="image/*"
        disabled={disabled || busy}
        onChange={(e) => {
          fileRef.current = e.target.files?.[0] ?? null
        }}
      />
      <Button
        variant="primary"
        loading={busy}
        disabled={disabled}
        onClick={async () => {
          if (!fileRef.current) return
          setBusy(true)
          try {
            await onUpload(fileRef.current)
          } finally {
            setBusy(false)
          }
        }}
      >
        Upload image
      </Button>
    </div>
  )
}
