import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AIFieldStatus = 'pending' | 'accepted' | 'edited' | 'rejected'

export interface AIDraft {
  description: string | null
  short_title: string | null
  specs: Record<string, unknown> | null
}

export interface AIReviewState {
  description: AIFieldStatus
  short_title: AIFieldStatus
  specs: AIFieldStatus
}

export const AI_FIELDS = ['description', 'short_title', 'specs'] as const
export type AIField = (typeof AI_FIELDS)[number]

interface ProductDraftState {
  part_number: string
  brand_id: string
  category_id: string
  stock_quantity: string
  image_file_name: string | null

  saved_product_id: number | null
  saving: boolean
  save_error: string | null

  ai_draft: AIDraft | null
  ai_loading: boolean
  ai_error: string | null
  ai_review: AIReviewState

  edited_description: string
  edited_short_title: string

  products_added_count: number

  setField: (field: 'part_number' | 'brand_id' | 'category_id' | 'stock_quantity', value: string) => void
  setImageFileName: (name: string | null) => void
  setSaving: (saving: boolean) => void
  setSaveError: (error: string | null) => void
  setSavedProductId: (id: number) => void

  setAIDraft: (draft: AIDraft) => void
  setAILoading: (loading: boolean) => void
  setAIError: (error: string | null) => void
  setAIFieldStatus: (field: keyof AIReviewState, status: AIFieldStatus) => void
  setEditedDescription: (value: string) => void
  setEditedShortTitle: (value: string) => void

  acceptAllAI: () => void
  firstPendingField: () => AIField | null

  allIdentityValid: () => boolean
  allAIReviewed: () => boolean
  canPublish: () => boolean

  resetDraft: () => void
  incrementProductCount: () => void
}

const INITIAL_REVIEW: AIReviewState = {
  description: 'pending',
  short_title: 'pending',
  specs: 'pending',
}

export const useProductDraftStore = create<ProductDraftState>()(
  persist(
    (set, get) => ({
      part_number: '',
      brand_id: '',
      category_id: '',
      stock_quantity: '',
      image_file_name: null,

      saved_product_id: null,
      saving: false,
      save_error: null,

      ai_draft: null,
      ai_loading: false,
      ai_error: null,
      ai_review: { ...INITIAL_REVIEW },

      edited_description: '',
      edited_short_title: '',

      products_added_count: 0,

      setField: (field, value) => set({ [field]: value }),
      setImageFileName: (name) => set({ image_file_name: name }),
      setSaving: (saving) => set({ saving }),
      setSaveError: (error) => set({ save_error: error }),
      setSavedProductId: (id) => set({ saved_product_id: id, saving: false, save_error: null }),

      setAIDraft: (draft) =>
        set({
          ai_draft: draft,
          ai_loading: false,
          ai_error: null,
          ai_review: { ...INITIAL_REVIEW },
          edited_description: draft.description || '',
          edited_short_title: draft.short_title || '',
        }),
      setAILoading: (loading) => set({ ai_loading: loading }),
      setAIError: (error) => set({ ai_error: error, ai_loading: false }),
      setAIFieldStatus: (field, status) =>
        set((s) => ({ ai_review: { ...s.ai_review, [field]: status } })),
      setEditedDescription: (value) => set({ edited_description: value }),
      setEditedShortTitle: (value) => set({ edited_short_title: value }),

      acceptAllAI: () =>
        set((s) => {
          const next: AIReviewState = { ...s.ai_review }
          for (const f of AI_FIELDS) {
            if (next[f] === 'pending') next[f] = 'accepted'
          }
          return { ai_review: next }
        }),

      firstPendingField: () => {
        const r = get().ai_review
        return AI_FIELDS.find((f) => r[f] === 'pending') ?? null
      },

      allIdentityValid: () => {
        const s = get()
        return (
          s.part_number.trim().length > 0 &&
          s.brand_id.length > 0 &&
          s.category_id.length > 0 &&
          parseInt(s.stock_quantity, 10) > 0
        )
      },

      allAIReviewed: () => {
        const r = get().ai_review
        const reviewed = (v: AIFieldStatus) => v === 'accepted' || v === 'edited' || v === 'rejected'
        return reviewed(r.description) && reviewed(r.short_title) && reviewed(r.specs)
      },

      canPublish: () => {
        const s = get()
        return s.allIdentityValid() && s.saved_product_id !== null && s.allAIReviewed()
      },

      resetDraft: () =>
        set({
          part_number: '',
          brand_id: '',
          category_id: '',
          stock_quantity: '',
          image_file_name: null,
          saved_product_id: null,
          saving: false,
          save_error: null,
          ai_draft: null,
          ai_loading: false,
          ai_error: null,
          ai_review: { ...INITIAL_REVIEW },
          edited_description: '',
          edited_short_title: '',
        }),

      incrementProductCount: () =>
        set((s) => ({ products_added_count: s.products_added_count + 1 })),
    }),
    {
      name: 'product-draft-v1',
      partialize: (state) => ({
        part_number: state.part_number,
        brand_id: state.brand_id,
        category_id: state.category_id,
        stock_quantity: state.stock_quantity,
        image_file_name: state.image_file_name,
        saved_product_id: state.saved_product_id,
        products_added_count: state.products_added_count,
      }),
    }
  )
)
