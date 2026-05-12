'use client'

/**
 * Spec 031 — Payment Operations dashboard.
 *
 * Phase 3 (T011) mounted SLO panel.
 * Phase 4 (T014) mounted stuck-payments table.
 * Phase 5 (T017) mounts reconciliation drift inbox.
 */

import { useState } from 'react'
import { usePaymentStats } from './_hooks/usePaymentStats'
import { useStuckPayments } from './_hooks/useStuckPayments'
import { useReconciliationDrift } from './_hooks/useReconciliationDrift'
import { SLOMetricsPanel } from './_components/SLOMetricsPanel'
import { StuckPaymentsTable } from './_components/StuckPaymentsTable'
import { ReconciliationDriftTable } from './_components/ReconciliationDriftTable'
import { PaymentLookupPanel } from './_components/PaymentLookupPanel'
import { CronTriggerButtons } from './_components/CronTriggerButtons'

export default function PaymentOperationsPage() {
  const { stats, isLoading: statsLoading, error: statsError } = usePaymentStats(24)
  const [includeExpired, setIncludeExpired] = useState(false)
  const {
    stuckAttempts,
    failedEvents,
    isLoading: stuckLoading,
    error: stuckError,
  } = useStuckPayments(includeExpired)
  const { driftEvents } = useReconciliationDrift(failedEvents)

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Payment Operations</h1>
        <p className="text-sm text-[--text-secondary]">
          SLO metrics, stuck payments, reconciliation drift, and manual cron triggers.
        </p>
      </header>

      <SLOMetricsPanel stats={stats} isLoading={statsLoading} error={statsError} />

      <StuckPaymentsTable
        attempts={stuckAttempts}
        isLoading={stuckLoading}
        error={stuckError}
        includeExpired={includeExpired}
        onToggleIncludeExpired={setIncludeExpired}
      />

      <ReconciliationDriftTable events={driftEvents} isLoading={stuckLoading} />

      <PaymentLookupPanel />

      <CronTriggerButtons />
    </main>
  )
}
