'use client'

import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api'
import type { AdminWarehouseRow } from '@/lib/admin-api'
import { disableAdminWarehouse, fetchAdminWarehouses } from '@/lib/admin-api'

import { WarehouseFormModal } from './WarehouseFormModal'
import { WarehouseListTable } from './WarehouseListTable'

const QKEY = ['admin-warehouses'] as const

export default function AdminWarehousesPage() {
  const qc = useQueryClient()
  const listQ = useQuery({
    queryKey: QKEY,
    queryFn: async () => {
      const res = await fetchAdminWarehouses(true)
      if (!res.ok) throw new Error(res.message)
      return res.data.warehouses
    },
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<AdminWarehouseRow | null>(null)

  const openCreate = useCallback(() => {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row: AdminWarehouseRow) => {
    setModalMode('edit')
    setEditing(row)
    setModalOpen(true)
  }, [])

  const disableMut = useMutation({
    mutationFn: async (row: AdminWarehouseRow) => {
      const res = await disableAdminWarehouse(row.id)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    onSuccess: () => {
      toast.success('Warehouse disabled')
      void qc.invalidateQueries({ queryKey: QKEY })
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e, 'Disable failed')),
  })

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Warehouses</h1>
        <Button type="button" data-testid="admin-warehouse-add" onClick={openCreate}>
          Add warehouse
        </Button>
      </div>

      {listQ.isLoading ? (
        <p className="text-[var(--text-secondary)]">Loading…</p>
      ) : listQ.isError ? (
        <p className="text-red-400" role="alert">
          {listQ.error instanceof Error ? listQ.error.message : 'Failed to load warehouses'}
        </p>
      ) : (
        <WarehouseListTable
          rows={listQ.data ?? []}
          onEdit={openEdit}
          onDisable={(row) => disableMut.mutate(row)}
        />
      )}

      <WarehouseFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => void qc.invalidateQueries({ queryKey: QKEY })}
      />
    </main>
  )
}
