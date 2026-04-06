'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { AIFieldStatus } from '@/state/productDraftStore'
import { Check, X, Pencil, Sparkles, CheckCircle2 } from 'lucide-react'

interface AIDraftCardProps {
  label: string
  content: string | null
  status: AIFieldStatus
  isActive: boolean
  onAccept: () => void
  onReject: () => void
  onEdit?: () => void
  editMode?: boolean
  editValue?: string
  onEditChange?: (value: string) => void
  onEditSave?: () => void
  multiline?: boolean
}

const statusColors: Record<AIFieldStatus, string> = {
  pending: 'border-amber-400/60 bg-amber-50/40',
  accepted: 'border-emerald-400/60 bg-emerald-50/40',
  edited: 'border-sky-400/60 bg-sky-50/40',
  rejected: 'border-red-300/60 bg-red-50/30',
}

const statusLabels: Record<AIFieldStatus, string> = {
  pending: 'Awaiting Review',
  accepted: 'Accepted',
  edited: 'Edited',
  rejected: 'Rejected',
}

const StatusIcon = React.memo(function StatusIcon({ status }: { status: AIFieldStatus }) {
  if (status === 'accepted') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
  if (status === 'edited') return <Pencil className="h-3.5 w-3.5 text-sky-600" />
  if (status === 'rejected') return <X className="h-3.5 w-3.5 text-red-500" />
  return <Sparkles className="h-3.5 w-3.5 text-amber-500" />
})

function AIDraftCardInner({
  label,
  content,
  status,
  isActive,
  onAccept,
  onReject,
  onEdit,
  editMode = false,
  editValue = '',
  onEditChange,
  onEditSave,
  multiline = false,
}: AIDraftCardProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (editMode && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      )
    }
  }, [editMode])

  const handleTextareaKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onEditSave) {
        e.preventDefault()
        onEditSave()
      }
      if (e.key === 'Escape' && onEdit) {
        e.preventDefault()
        if (onEditChange && content) onEditChange(content)
        onEdit()
      }
    },
    [onEditSave, onEdit, onEditChange, content]
  )

  return (
    <div
      className={cn(
        'rounded-[4px] border-2 p-4 transition-all duration-150',
        statusColors[status],
        isActive && status === 'pending' && 'ring-2 ring-[#0072CE]/30 ring-offset-1'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon status={status} />
          <span
            className={cn(
              'text-[11px] font-semibold uppercase tracking-wider',
              status === 'pending' && 'text-amber-600',
              status === 'accepted' && 'text-emerald-600',
              status === 'edited' && 'text-sky-600',
              status === 'rejected' && 'text-red-500'
            )}
          >
            {status === 'pending' ? 'AI Draft' : statusLabels[status]}
          </span>
          <span className="text-[10px] text-[#6B7280]">{label}</span>
        </div>
        {isActive && status === 'pending' && (
          <span className="animate-pulse rounded-[2px] bg-[#0072CE]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#0072CE]">
            ACTIVE
          </span>
        )}
      </div>

      {editMode && onEditChange ? (
        <div className="mb-3">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            rows={multiline ? 4 : 2}
            className="w-full rounded-[2px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#0072CE] focus:outline-none focus:ring-1 focus:ring-[#0072CE]/20"
          />
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={onEditSave}>
              Save
              <kbd className="ml-1 rounded border border-white/30 px-1 py-0.5 text-[9px] font-mono opacity-70">
                Ctrl+Enter
              </kbd>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (onEditChange && content) onEditChange(content)
                if (onEdit) onEdit()
              }}
            >
              Cancel
              <kbd className="ml-1 rounded border border-[#E5E7EB] px-1 py-0.5 text-[9px] font-mono opacity-70">
                Esc
              </kbd>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          {content ? (
            <p
              className={cn(
                'whitespace-pre-wrap text-sm leading-relaxed text-[#1A1A1A]',
                status === 'rejected' && 'line-through opacity-50'
              )}
            >
              {content}
            </p>
          ) : (
            <p className="text-sm italic text-[#9CA3AF]">No content generated</p>
          )}
        </div>
      )}

      {status === 'pending' && !editMode && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={onAccept} aria-label={`Accept ${label}`}>
            <Check className="h-3.5 w-3.5" />
            Accept
            <kbd className="ml-1 rounded border border-white/30 px-1 py-0.5 text-[9px] font-mono opacity-70">
              A
            </kbd>
          </Button>
          {onEdit && (
            <Button size="sm" variant="secondary" onClick={onEdit} aria-label={`Edit ${label}`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
              <kbd className="ml-1 rounded border border-[#E5E7EB] px-1 py-0.5 text-[9px] font-mono opacity-70">
                E
              </kbd>
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onReject} aria-label={`Reject ${label}`}>
            <X className="h-3.5 w-3.5" />
            Reject
            <kbd className="ml-1 rounded border border-white/30 px-1 py-0.5 text-[9px] font-mono opacity-70">
              R
            </kbd>
          </Button>
        </div>
      )}
    </div>
  )
}

export const AIDraftCard = React.memo(AIDraftCardInner)
