// src/store/expenseCategoriesStore.ts
// Zustand-стор категорий в стиле groupMembersStore:
//  • parentId: null → верхний уровень; number → подкатегории
//  • fetchCategories(offset, limit) с пагинацией { total, items }
//  • setParent(parentId), setPage(p), clearCategories()

import { create } from "zustand"
import type { ExpenseCategoryOut } from "../types/expense_category"
import { getExpenseCategories } from "../api/expenseCategoriesApi"

interface ExpenseCategoriesStore {
  parentId: number | null

  items: ExpenseCategoryOut[]
  total: number

  loading: boolean
  error: string | null

  page: number
  hasMore: boolean

  setParent: (parentId: number | null) => void
  setPage: (p: number) => void

  fetchCategories: (offset?: number, limit?: number) => Promise<void>

  clearCategories: () => void
}

const PAGE_SIZE = 20

export const useExpenseCategoriesStore = create<ExpenseCategoriesStore>((set, get) => ({
  parentId: null,

  items: [],
  total: 0,

  loading: false,
  error: null,

  page: 0,
  hasMore: true,

  setParent(parentId) {
    set({
      parentId,
      items: [],
      total: 0,
      page: 0,
      hasMore: true,
      error: null,
    })
  },

  setPage(p) {
    set({ page: p })
  },

  async fetchCategories(offset = 0, limit = PAGE_SIZE)  {
    set({ loading: true, error: null })
    try {
      const { parentId, items } = get()
      const { total, items: newItems } = await getExpenseCategories({
        parentId: parentId ?? null,
        offset,
        limit,
      })

      set({
        items: offset === 0 ? newItems : [...items, ...newItems],
        total,
        loading: false,
        hasMore: offset + (newItems?.length || 0) < total,
      })
    } catch (e: any) {
      set({ error: e.message || "Ошибка загрузки категорий", loading: false })
    }
  },

  clearCategories() {
    set({
      parentId: null,
      items: [],
      total: 0,
      page: 0,
      hasMore: true,
      error: null,
    })
  },
}))
