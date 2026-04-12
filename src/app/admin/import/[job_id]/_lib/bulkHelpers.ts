import type { StagedRow } from '@/features/admin/services/adminService'
import type { BulkActionType } from '../_hooks/useJobDashboard'

export type PreviewAction = BulkActionType | 'publish'

export interface PreviewSummary {
  action: PreviewAction
  actionLabel: string
  totalSelected: number
  eligible: number
  ineligible: number
  ineligibleReason: string
}

const ACTION_LABELS: Record<PreviewAction, string> = {
  approve_selected: 'Approve',
  reject_selected: 'Reject',
  publish: 'Publish',
}

const ELIGIBLE_STATUSES: Record<PreviewAction, Set<string>> = {
  approve_selected: new Set(['valid']),
  reject_selected: new Set(['valid', 'invalid', 'duplicate', 'pending']),
  publish: new Set(['approved']),
}

const INELIGIBLE_REASONS: Record<PreviewAction, string> = {
  approve_selected: 'Only rows with status "valid" can be approved.',
  reject_selected: 'Already-approved or published rows cannot be rejected.',
  publish: 'Only approved rows can be published.',
}

export function computeEligibleRows(
  selectedIds: Set<number>,
  rows: StagedRow[],
  action: PreviewAction,
): { eligible: StagedRow[]; ineligible: StagedRow[] } {
  const allowed = ELIGIBLE_STATUSES[action]
  const eligible: StagedRow[] = []
  const ineligible: StagedRow[] = []

  for (const row of rows) {
    if (!selectedIds.has(row.id)) continue
    if (allowed.has(row.status)) {
      eligible.push(row)
    } else {
      ineligible.push(row)
    }
  }

  return { eligible, ineligible }
}

export function buildPreviewSummary(
  selectedIds: Set<number>,
  rows: StagedRow[],
  action: PreviewAction,
): PreviewSummary {
  const { eligible, ineligible } = computeEligibleRows(selectedIds, rows, action)
  return {
    action,
    actionLabel: ACTION_LABELS[action],
    totalSelected: selectedIds.size,
    eligible: eligible.length,
    ineligible: ineligible.length,
    ineligibleReason: INELIGIBLE_REASONS[action],
  }
}
