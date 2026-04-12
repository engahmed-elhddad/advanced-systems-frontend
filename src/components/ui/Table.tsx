'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const shell = 'relative w-full overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg shadow-black/25'
const tableText = 'text-white/95'

export interface TableRootProps extends React.HTMLAttributes<HTMLTableElement> {
  /** @deprecated Visual is always glass */
  variant?: 'light' | 'dark'
  bleed?: boolean
}

export const Table = React.forwardRef<HTMLTableElement, TableRootProps>(
  ({ className, bleed = false, variant: _variant, ...props }, ref) => (
    <div className={bleed ? 'relative w-full overflow-x-auto' : shell}>
      <table ref={ref} className={cn('w-full caption-bottom text-sm', tableText, bleed && 'rounded-none', className)} {...props} />
    </div>
  )
)
Table.displayName = 'Table'

export type TableVariant = 'light' | 'dark'

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        'border-b border-white/10 text-xs font-bold uppercase tracking-wider text-white/50',
        className
      )}
      {...props}
    />
  )
)
TableHeader.displayName = 'TableHeader'

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
)
TableBody.displayName = 'TableBody'

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('border-t border-white/10 bg-white/[0.04] font-medium text-white/70', className)}
      {...props}
    />
  )
)
TableFooter.displayName = 'TableFooter'

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-white/[0.06] transition-all duration-300 hover:bg-white/[0.08]',
      'data-[state=selected]:bg-white/[0.1]',
      className
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-bold text-white/70 [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('px-4 py-3.5 align-middle text-white/90 [&:has([role=checkbox])]:pr-0', className)} {...props} />
))
TableCell.displayName = 'TableCell'

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-sm text-white/50', className)} {...props} />
  )
)
TableCaption.displayName = 'TableCaption'
