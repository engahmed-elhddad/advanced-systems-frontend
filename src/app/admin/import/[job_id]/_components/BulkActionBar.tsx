'use client'

import { useState } from 'react'
import { CheckSquare, Loader2, Upload, X, XSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StagedRow, BulkActionResponse, PublishResponse } from '@/features/admin/services/adminService'
import type { BulkActionPayload, SelectionState, UseJobDashboardReturn } from '../_hooks/useJobDashboard'
import { buildPreviewSummary, type PreviewAction, type PreviewSummary } from '../_lib/bulkHelpers'
import { PreviewModal } from './PreviewModal'

interface Props {
  rows: StagedRow[]
  selection: SelectionState
  mutations: UseJobDashboardReturn['mutations']
  jobId: number
}

interface ActionButton {
  key: PreviewAction
  label: string
  icon: React.ComponentType<{ className?: string }>
  variant: 'primary' | 'danger' | 'publish'
}

const ACTIONS: ActionButton[] = [
  { key: 'approve_selected', label: 'Approve', icon: CheckSquare, variant: 'primary' },
  { key: 'reject_selected',  label: 'Reject',  icon: XSquare,     variant: 'danger' },
  { key: 'publish',          label: 'Publish',  icon: Upload,      variant: 'publish' },
]

const VARIANT_CLASSES: Record<ActionButton['variant'], string> = {
  primary: 'text-orange-400 hover:bg-orange-400/10',
  danger:  'text-red-400 hover:bg-red-400/10',
  publish: 'text-emerald-400 hover:bg-emerald-400/10',
}

export function BulkActionBar({ rows, selection, mutations, jobId }: Props) {
  const [previewAction, setPreviewAction] = useState<PreviewAction | null>(null)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)

  const count = selection.selectedRowIds.size
  if (count === 0) return null

  const summary: PreviewSummary | null = previewAction
    ? buildPreviewSummary(selection.selectedRowIds, rows, previewAction)
    : null

  const isPending = mutations.bulkAction.isPending || mutations.publish.isPending

  const handleOpenPreview = (action: PreviewAction) => {
    setResult(null)
    setPreviewAction(action)
  }

  const handleConfirm = () => {
    if (!previewAction || !summary || summary.eligible === 0) return

    if (previewAction === 'publish') {
      mutations.publish.mutate(undefined, {
        onSuccess: (res: PublishResponse) => {
          setResult({ success: res.published, failed: res.errors.length })
        },
        onError: () => {
          setResult({ success: 0, failed: summary.eligible })
        },
      })
    } else {
      const ids = Array.from(selection.selectedRowIds)
      mutations.bulkAction.mutate(
        { action: previewAction, rowIds: ids },
        {
          onSuccess: (res: BulkActionResponse) => {
            setResult({ success: res.affected, failed: 0 })
          },
          onError: () => {
            setResult({ success: 0, failed: ids.length })
          },
        },
      )
    }
  }

  const handleClose = () => {
    setPreviewAction(null)
    setResult(null)
  }

  return (
    <>
      <div
        className={cn(
          'sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2',
          'rounded-xl border border-orange-400/20 bg-orange-400/10 px-4 py-2.5',
        )}
      >
        {/* Left: count + clear */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-orange-400">
            {count} row{count !== 1 ? 's' : ''} selected
          </span>
          <button
            type="button"
            onClick={selection.clearSelection}
            aria-label="Clear selection"
            className="rounded-[2px] p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1">
          {ACTIONS.map(({ key, label, icon: Icon, variant }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleOpenPreview(key)}
              disabled={isPending}
              className={cn(
                'inline-flex items-center gap-1 rounded-[2px] px-2.5 py-1.5 text-xs font-medium',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-white/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
                VARIANT_CLASSES[variant],
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview + Confirmation modal */}
      <PreviewModal
        open={previewAction !== null}
        summary={summary}
        isPending={isPending}
        result={result}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </>
  )
}
