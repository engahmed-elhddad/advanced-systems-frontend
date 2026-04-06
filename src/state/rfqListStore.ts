import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RFQItem {
  part_number: string
  quantity: number
}

interface RFQListState {
  items: RFQItem[]
  addItem: (item: RFQItem) => void
  removeItem: (part_number: string) => void
  updateQuantity: (part_number: string, quantity: number) => void
  clear: () => void
}

export const useRFQListStore = create<RFQListState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.part_number === item.part_number,
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.part_number === item.part_number
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            }
          }
          return { items: [...state.items, item] }
        }),

      removeItem: (part_number) =>
        set((state) => ({
          items: state.items.filter((i) => i.part_number !== part_number),
        })),

      updateQuantity: (part_number, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.part_number === part_number ? { ...i, quantity } : i,
          ),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: 'rfq-list' },
  ),
)
