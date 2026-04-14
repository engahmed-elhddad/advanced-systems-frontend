/**
 * UI primitive components — AdvancedSystems industrial / glass design system.
 * Use for admin dashboard and marketplace; prefer `SortableTable` for column-driven data grids.
 */
export { Button } from './Button'
export type { ButtonProps, ButtonVariant } from './Button'
export { Card } from './Card'
export type { CardProps, CardVariant } from './Card'
export { Badge } from './Badge'
export type { BadgeProps, BadgeVariant } from './Badge'
export { Container } from './Container'
export type { ContainerProps } from './Container'
export { Section } from './Section'
export type { SectionProps } from './Section'
export { Input } from './Input'
export type { InputProps } from './Input'
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './Table'
export type {
  TableRootProps,
  TableVariant,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableCaptionProps,
} from './Table'
export { SortableTable } from './SortableTable'
export type { TableColumn, TableProps, SortableTableColumn, SortableTableProps } from './SortableTable'
export { Select } from './Select'
export type { SelectProps } from './Select'
export { FilterChip } from './FilterChip'
export type { FilterChipProps } from './FilterChip'
export { Pagination } from './Pagination'
export type { PaginationProps } from './Pagination'
export { EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'
export { LinkButton } from './LinkButton'
export type { LinkButtonProps } from './LinkButton'
export { Spinner } from './Spinner'
export type { SpinnerProps } from './Spinner'
export { SectionHeader } from './SectionHeader'
export { CategoryCard } from './CategoryCard'
export type { CategoryCardProps } from './CategoryCard'
export { ProductSkeleton, ProductGridSkeleton } from './ProductSkeleton'
export { BrandLogo } from './BrandLogo'
export { ProductImage } from './ProductImage'
export { ProductImageWithFallback } from './ProductImageWithFallback'
export { MailIcon } from './MailIcon'
export { SafeImage } from './SafeImage'
export { Modal } from './Modal'
export type { ModalProps } from './Modal'
/** TanStack enterprise `DataTable` — `getRowId: (row) => string`, optional server mode, selection, CSV. */
export { DataTable } from './DataTable'
export type {
  DataTableBulkAction,
  DataTableBulkToolbarContext,
  DataTableColumnMeta,
  DataTableIdentifiableRow,
  DataTableProps,
  DataTableSavedViewListItem,
  DataTableViewConfig,
} from './DataTable'
export { DataTableErrorBoundary, type DataTableErrorReportPayload } from './DataTableErrorBoundary'
export { DataTableThemeProvider, useDataTableTheme, type DataTableThemeTokens } from './DataTableThemeContext'
export { invariant } from '@/lib/dataTable/invariant'
export { classifyTableError, type DataTableErrorKind } from '@/lib/dataTable/classifyTableError'
/** @deprecated Column-key grid — import from `@/components/ui/DataTableLegacy` (see file JSDoc). */
export {
  DataTableLegacy,
  DataTable as DataTableColumnKey,
  type DataTableLegacyColumn,
  type DataTableLegacyProps,
  type DataTableColumn,
  type DataTableProps as LegacyDataTableProps,
} from './DataTableLegacy'
export {
  buildCsvContent,
  CSV_EXPORT_WARN_ROW_LIMIT,
  exportRowsToCSV,
  type CsvExportColumn,
} from '@/lib/dataTable/exportRowsToCSV'
export { createGetRowId } from '@/lib/dataTable/createGetRowId'
export { dataTableTheme } from '@/lib/dataTable/dataTableTheme'
export { useDebouncedTableInput } from '@/lib/dataTable/useDebouncedTableInput'
export { useDataTableQuery } from '@/lib/dataTable/useDataTableQuery'
export { createScopedStorageKey, type ScopedStorageKeyOptions } from '@/lib/dataTable/createScopedStorageKey'
export {
  readEnvelope,
  writeEnvelope,
  removeIfExpired,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
} from '@/lib/dataTable/dataTableStorageManager'
export { filterColumnsByRoles, canUseBulkAction } from '@/lib/dataTable/dataTableRbac'
export type { DataTableEvent, DataTableEventType } from '@/lib/dataTable/dataTableEvents'
export { formatDataTableSentryEvent, type SentryLikeTablePayload } from '@/lib/dataTable/formatDataTableSentryEvent'
export { Skeleton, SkeletonLine } from './Skeleton'
export type { SkeletonProps } from './Skeleton'
export { ToastViewport, ToastViewport as Toast } from './Toast'
