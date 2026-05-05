'use client'

import type { AdminWarehouseRow } from '@/lib/admin-api'
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'

export function WarehouseListTable(props: {
  rows: AdminWarehouseRow[]
  onEdit: (row: AdminWarehouseRow) => void
  onDisable: (row: AdminWarehouseRow) => void
}) {
  const { rows, onEdit, onDisable } = props
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10" data-testid="admin-warehouses-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name EN</TableHead>
            <TableHead>Name AR</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Lead days</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((w) => (
            <TableRow
              key={w.id}
              className={w.is_active ? '' : 'opacity-50'}
              data-testid={`admin-warehouse-row-${w.code}`}
            >
              <TableCell className="font-mono">{w.code}</TableCell>
              <TableCell>{w.name_en}</TableCell>
              <TableCell dir="rtl">{w.name_ar}</TableCell>
              <TableCell>{w.country_code}</TableCell>
              <TableCell>{w.default_lead_time_days ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={w.is_active ? 'success' : 'warning'}>{w.is_active ? 'Active' : 'Disabled'}</Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(w)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!w.is_active}
                  onClick={() => onDisable(w)}
                >
                  Disable
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
