import { create } from 'zustand'

interface UIState {
  viewMode: 'grid' | 'table'
  setViewMode: (mode: 'grid' | 'table') => void
  rfqModalOpen: boolean
  rfqModalPartNumber: string | null
  rfqListMode: boolean
  openRFQModal: (partNumber?: string) => void
  openRFQListModal: () => void
  closeRFQModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),
  rfqModalOpen: false,
  rfqModalPartNumber: null,
  rfqListMode: false,
  openRFQModal: (partNumber) =>
    set({ rfqModalOpen: true, rfqModalPartNumber: partNumber ?? null, rfqListMode: false }),
  openRFQListModal: () =>
    set({ rfqModalOpen: true, rfqModalPartNumber: null, rfqListMode: true }),
  closeRFQModal: () =>
    set({ rfqModalOpen: false, rfqModalPartNumber: null, rfqListMode: false }),
}))
