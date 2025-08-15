// src/store/transactionsStore.ts
// Zustand-стор транзакций по образцу groupMembersStore.ts:
//  • setFilters({ groupId, userId, type })
//  • fetchTransactions(offset?, limit?)
//  • addTransaction(payload) — оптимистично добавляем в начало
//  • removeTransaction(id) — удаляем из списка
//  • clearTransactions()

import { create } from "zustand"
import type { TransactionOut, TxType, TransactionCreateRequest } from "../types/transaction"
import {
  getTransactions,
  createTransaction as createTransactionApi,
  removeTransaction as removeTransactionApi,
} from "../api/transactionsApi"

interface TransactionsStore {
  // Фильтры
  groupId: number | null
  userId: number | null
  type: TxType | null

  items: TransactionOut[]
  total: number

  loading: boolean
  error: string | null

  page: number
  hasMore: boolean

  setFilters: (f: { groupId?: number | null; userId?: number | null; type?: TxType | null }) => void
  setPage: (p: number) => void

  fetchTransactions: (offset?: number, limit?: number) => Promise<void>
  addTransaction: (payload: TransactionCreateRequest) => Promise<void>
  removeTransaction: (id: number) => Promise<void>

  clearTransactions: () => void
}

const PAGE_SIZE = 20

export const useTransactionsStore = create<TransactionsStore>((set, get) => ({
  groupId: null,
  userId: null,
  type: null,

  items: [],
  total: 0,

  loading: false,
  error: null,

  page: 0,
  hasMore: true,

  setFilters({ groupId, userId, type }) {
    set((s) => ({
      groupId: groupId === undefined ? s.groupId : groupId,
      userId: userId === undefined ? s.userId : userId,
      type: type === undefined ? s.type : type,
      // сбрасываем пагинацию и текущие данные
      items: [],
      total: 0,
      page: 0,
      hasMore: true,
      error: null,
    }))
  },

  setPage(p) {
    set({ page: p })
  },

  async fetchTransactions(offset = 0, limit = PAGE_SIZE) {
    set({ loading: true, error: null })
    try {
      const { groupId, userId, type, items } = get()
      const { total, items: newItems } = await getTransactions({
        groupId: groupId ?? undefined,
        userId: userId ?? undefined,
        type: type ?? undefined,
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
      set({ error: e.message || "Ошибка загрузки транзакций", loading: false })
    }
  },

  async addTransaction(payload) {
    set({ error: null })
    try {
      const created = await createTransactionApi(payload)
      const { items, total } = get()
      set({
        items: [created, ...items],
        total: total + 1,
      })
    } catch (e: any) {
      set({ error: e.message || "Не удалось создать транзакцию" })
      throw e
    }
  },

  async removeTransaction(id: number) {
    set({ error: null })
    try {
      await removeTransactionApi(id)
      const { items, total } = get()
      set({
        items: items.filter((t) => t.id !== id),
        total: Math.max(0, total - 1),
      })
    } catch (e: any) {
      set({ error: e.message || "Не удалось удалить транзакцию" })
      throw e
    }
  },

  clearTransactions() {
    set({ items: [], total: 0, page: 0, hasMore: true, error: null })
  },
}))
