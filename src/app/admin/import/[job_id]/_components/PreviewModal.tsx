'use client'

import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui'
import type { PreviewSummary } from '../_lib/bulkHelpers'

interface Props {
  open: boolean
  summary: PreviewSummary | null
  isPending: boolean
  result: { success: number; failed: number } | null
  onConfirm: () => void
  onClose: () => void
}

function SummaryBody({ summary }: { summary: PreviewSummary }) {
  const hasIneligible = summary.ineligible > 0

  return (
    <div className="space-y-4">
      {/* Counts */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Selected" value={summary.totalSelected} color="text-white" />
        <StatTile label="Eligible" value={summary.eligible} color="text-emerald-400" />
        <StatTile
          label="Ineligible"
          value={summary.ineligible}
          color={hasIneligible ? 'text-red-400' : 'text-white/50'}
        />
      </div>

      {/* Ineligible explanation */}
      {hasIneligible && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
          <div className="text-xs text-amber-300">
            <p className="font-medium">{summary.ineligible} row(s) will be skipped.</p>
            <p className="mt-0.5">{summary.ineligibleReason}</p>
          </div>
        </div>
      )}

      {/* Zero eligible guard */}
      {summary.eligible === 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
          <p className="text-xs font-medium text-red-300">
            No rows are eligible for this action.
          </p>
        </div>
      )}
    </div>
  )
}

function ResultBody({ result, actionLabel }: { result: { success: number; failed: number }; actionLabel: string }) {
  const allSuccess = result.failed === 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {allSuccess ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden />
        )}
        <p className="text-sm font-medium text-white">
          {allSuccess
            ? `${result.success} row(s) ${actionLabel.toLowerCase()}d successfully.`
            : `${result.success} succeeded, ${result.failed} failed.`}
        </p>
      </div>
    </div>
  )
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <p className={cn('mt-1 font-mono text-xl font-bold', color)}>{value}</p>
    </div>
  )
}

export function PreviewModal({ open, summary, isPending, result, onConfirm, onClose }: Props) {
  const title = summary
    ? `${summary.actionLabel} ${summary.totalSelected} Row(s)`
    : 'Bulk Action'

  const canConfirm = summary !== null && summary.eligible > 0 && !isPending && !result

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!isPending}
      closeOnEsc={!isPending}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={cn(
              'rounded-[2px] px-3 py-1.5 text-xs font-medium text-white/50',
              'transition-colors hover:bg-white/[0.06] hover:text-white',
              'focus:outline-none focus:ring-2 focus:ring-white/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className={cn(
                'inline-flex items-center gap-1 rounded-[2px] px-3 py-1.5 text-xs font-medium text-white',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-white/20',
                'disabled:cursor-not-allowed disabled:opacity-70',
                summary?.action === 'reject_selected'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-500 hover:bg-orange-600',
              )}
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {isPending ? 'Processing…' : `Confirm ${summary?.actionLabel ?? ''}`}
            </button>
          )}
        </div>
      }
    >
      {result ? (
        <ResultBody result={result} actionLabel={summary?.actionLabel ?? 'Action'} />
      ) : summary ? (
        <SummaryBody summary={summary} />
      ) : null}
    </Modal>
  )
}
