'use client'

import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
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
        <StatTile label="Selected" value={summary.totalSelected} color="text-[#1A1A1A]" />
        <StatTile label="Eligible" value={summary.eligible} color="text-emerald-700" />
        <StatTile
          label="Ineligible"
          value={summary.ineligible}
          color={hasIneligible ? 'text-red-700' : 'text-[#6B7280]'}
        />
      </div>

      {/* Ineligible explanation */}
      {hasIneligible && (
        <div className="flex items-start gap-2 rounded-[2px] border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <div className="text-xs text-amber-800">
            <p className="font-medium">{summary.ineligible} row(s) will be skipped.</p>
            <p className="mt-0.5">{summary.ineligibleReason}</p>
          </div>
        </div>
      )}

      {/* Zero eligible guard */}
      {summary.eligible === 0 && (
        <div className="flex items-start gap-2 rounded-[2px] border border-red-200 bg-red-50 px-3 py-2">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
          <p className="text-xs font-medium text-red-700">
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
          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden />
        )}
        <p className="text-sm font-medium text-[#1A1A1A]">
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
    <div className="rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">{label}</p>
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
              'rounded-[2px] px-3 py-1.5 text-xs font-medium text-[#6B7280]',
              'transition-colors hover:bg-[#F3F4F6] hover:text-[#1A1A1A]',
              'focus:outline-none focus:ring-2 focus:ring-[#0072CE]/30',
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
                'transition-colors focus:outline-none focus:ring-2 focus:ring-[#0072CE]/30',
                'disabled:cursor-not-allowed disabled:opacity-70',
                summary?.action === 'reject_selected'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#0072CE] hover:bg-[#005BA4]',
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
