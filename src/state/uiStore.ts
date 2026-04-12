import { create } from 'zustand'

interface UIState {
  viewMode: 'grid' | 'table'
  setViewMode: (mode: 'grid' | 'table') => void
  rfqModalOpen: boolean
  rfqModalPartNumber: string | null
  rfqModalProductId: number | null
  rfqListMode: boolean
  openRFQModal: (partNumber?: string, productId?: number | null) => void
  openRFQListModal: () => void
  closeRFQModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),
  rfqModalOpen: false,
  rfqModalPartNumber: null,
  rfqModalProductId: null,
  rfqListMode: false,
  openRFQModal: (partNumber, productId) =>
    set({
      rfqModalOpen: true,
      rfqModalPartNumber: partNumber ?? null,
      rfqModalProductId: productId ?? null,
      rfqListMode: false,
    }),
  openRFQListModal: () =>
    set({ rfqModalOpen: true, rfqModalPartNumber: null, rfqModalProductId: null, rfqListMode: true }),
  closeRFQModal: () =>
    set({ rfqModalOpen: false, rfqModalPartNumber: null, rfqModalProductId: null, rfqListMode: false }),
}))
