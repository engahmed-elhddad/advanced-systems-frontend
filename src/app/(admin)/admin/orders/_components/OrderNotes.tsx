'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { OrderNote } from '@/services/adminService'

interface OrderNotesProps {
  notes: OrderNote[]
  loading: boolean
  submitting: boolean
  onAddNote: (note: string) => void
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}

export function OrderNotes({ notes, loading, submitting, onAddNote }: OrderNotesProps) {
  const [note, setNote] = useState('')

  const submit = () => {
    const trimmed = note.trim()
    if (!trimmed) return
    onAddNote(trimmed)
    setNote('')
  }

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]">Notes</h3>

      <div className="mb-3 space-y-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add note..."
          className="min-h-[84px] w-full rounded-[2px] border border-[#E5E7EB] px-3 py-2 text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#0072CE]"
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={!note.trim() || submitting}
          loading={submitting}
          onClick={submit}
        >
          Add Note
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-[2px] bg-[#F3F4F6]" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <p className="text-xs text-[#6B7280]">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((entry) => (
            <li key={entry.id} className="rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB] p-2.5">
              <p className="text-sm text-[#1A1A1A]">{entry.note}</p>
              <p className="mt-1 text-[11px] text-[#6B7280]">
                {formatDate(entry.created_at)}
                {entry.created_by ? ` • ${entry.created_by}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

