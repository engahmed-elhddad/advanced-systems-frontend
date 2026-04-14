export type DataTableEventType =
  | 'sort_changed'
  | 'filter_changed'
  | 'selection_changed'
  | 'bulk_action_triggered'
  | 'export_triggered'
  | 'column_visibility_changed'
  | 'analytics_tick'

export type DataTableEvent = {
  type: DataTableEventType
  tableId: string
  timestamp: number
  payload: Record<string, unknown>
}
