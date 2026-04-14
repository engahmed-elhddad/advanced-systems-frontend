/**
 * Shared layout tokens for TanStack `DataTable` (admin / glass surfaces).
 * Import into `tableClassName` / `bodyRowClassName` defaults for consistency.
 */
export type DataTableThemeTokens = {
  table: string
  bodyRow: string
  rowSelected: string
  emptyPanel: string
  /** Focus ring for keyboard / tab focus (rows, controls) */
  focusRing: string
}

export const dataTableTheme: DataTableThemeTokens = {
  /** Default `<table>` utilities */
  table: 'min-w-full border-separate border-spacing-y-2 text-sm',
  /** Default body row: glass hover + selection ring compatibility */
  bodyRow:
    'group text-white/90 transition-all duration-300 [&>td]:bg-white/[0.04] [&>td]:backdrop-blur-sm hover:[&>td]:bg-white/[0.09]',
  /** Applied when row is selected (merged in DataTable) */
  rowSelected: 'ring-1 ring-orange-400/35 ring-inset',
  /** Empty-state panel */
  emptyPanel:
    'rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/60',
  focusRing: 'outline-none ring-2 ring-orange-400/50 ring-offset-2 ring-offset-[#0b0f19]',
}
