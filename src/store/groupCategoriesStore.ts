// src/store/groupCategoriesStore.ts
// Стор «категории группы»: состояние по каждой группе отдельно.
// Умеет: список с пагинацией/поиском, link/unlink, create+link, хранит флаг restricted.

import { create } from "zustand"
import type { ExpenseCategory, GroupCategoriesList } from "../types/group_category"
import {
  listGroupCategories,
  linkGroupCategory,
  unlinkGroupCategory,
  createAndLinkGroupCategory,
} from "../api/groupCategoriesApi"

type Id = number

type PerGroup<T> = Record<Id, T>

interface GroupCategoriesStore {
  // Текущая группа в UI (не обязательно, но удобно)
  currentGroupId: Id | null

  // Пер-групповые состояния
  items: PerGroup<ExpenseCategory[]>
  total: PerGroup<number>
  restricted: PerGroup<boolean>
  offset: PerGroup<number>
  limit: number
  hasMore: PerGroup<boolean>
  q: PerGroup<string>

  loading: PerGroup<boolean>
  error: PerGroup<string | null>

  // Управление текущей группой/поиском
  setGroup: (groupId: Id) => void
  setQuery: (groupId: Id, q: string) => void
  resetGroup: (groupId: Id) => void

  // Загрузка
  fetchList: (groupId: Id, opts?: { reset?: boolean }) => Promise<void>
  loadMore: (groupId: Id) => Promise<void>

  // Мутации
  link: (groupId: Id, categoryId: Id) => Promise<void>
  unlink: (groupId: Id, categoryId: Id) => Promise<void>
  createAndLink: (groupId: Id, payload: { name: string; icon?: string | null }) => Promise<void>
}

const PAGE_LIMIT = 100

export const useGroupCategoriesStore = create<GroupCategoriesStore>((set, get) => ({
  currentGroupId: null,

  items: {},
  total: {},
  restricted: {},
  offset: {},
  limit: PAGE_LIMIT,
  hasMore: {},
  q: {},

  loading: {},
  error: {},

  setGroup(groupId) {
    // Если группа меняется — убедимся, что есть базовые записи в словарях
    set((state) => ({
      currentGroupId: groupId,
      items: state.items[groupId] ? state.items : { ...state.items, [groupId]: [] },
      total: state.total[groupId] != null ? state.total : { ...state.total, [groupId]: 0 },
      restricted: state.restricted[groupId] != null ? state.restricted : { ...state.restricted, [groupId]: false },
      offset: state.offset[groupId] != null ? state.offset : { ...state.offset, [groupId]: 0 },
      hasMore: state.hasMore[groupId] != null ? state.hasMore : { ...state.hasMore, [groupId]: true },
      q: state.q[groupId] != null ? state.q : { ...state.q, [groupId]: "" },
      loading: { ...state.loading, [groupId]: false },
      error: { ...state.error, [groupId]: null },
    }))
  },

  setQuery(groupId, q) {
    set((state) => ({
      q: { ...state.q, [groupId]: q },
      items: { ...state.items, [groupId]: [] },
      total: { ...state.total, [groupId]: 0 },
      offset: { ...state.offset, [groupId]: 0 },
      hasMore: { ...state.hasMore, [groupId]: true },
      error: { ...state.error, [groupId]: null },
    }))
  },

  resetGroup(groupId) {
    set((state) => ({
      items: { ...state.items, [groupId]: [] },
      total: { ...state.total, [groupId]: 0 },
      offset: { ...state.offset, [groupId]: 0 },
      hasMore: { ...state.hasMore, [groupId]: true },
      error: { ...state.error, [groupId]: null },
    }))
  },

  async fetchList(groupId, opts) {
    const { limit, items, offset, q, loading } = get()
    const reset = !!opts?.reset
    const effOffset = reset ? 0 : (offset[groupId] || 0)
    if (loading[groupId]) return

    // Ставим loading=true локально для этой группы
    set((state) => ({ loading: { ...state.loading, [groupId]: true }, error: { ...state.error, [groupId]: null } }))

    try {
      const res: GroupCategoriesList = await listGroupCategories(groupId, {
        q: q[groupId],
        limit,
        offset: effOffset,
      })

      set((state) => {
        const prevItems = reset ? [] : (items[groupId] || [])
        const nextItems = [...prevItems, ...res.items]
        const nextOffset = effOffset + res.items.length
        const nextHasMore = nextOffset < res.total

        return {
          items: { ...state.items, [groupId]: nextItems },
          total: { ...state.total, [groupId]: res.total },
          restricted: { ...state.restricted, [groupId]: !!res.restricted },
          offset: { ...state.offset, [groupId]: nextOffset },
          hasMore: { ...state.hasMore, [groupId]: nextHasMore },
          loading: { ...state.loading, [groupId]: false },
          error: { ...state.error, [groupId]: null },
        }
      })
    } catch (e: any) {
      set((state) => ({
        loading: { ...state.loading, [groupId]: false },
        error: { ...state.error, [groupId]: e?.message || "Ошибка загрузки категорий" },
      }))
    }
  },

  async loadMore(groupId) {
    const { hasMore, loading } = get()
    if (!hasMore[groupId] || loading[groupId]) return
    await get().fetchList(groupId, { reset: false })
  },

  // Добавить существующую категорию в белый список группы
  async link(groupId, categoryId) {
    set((state) => ({ error: { ...state.error, [groupId]: null } }))
    try {
      await linkGroupCategory(groupId, categoryId)
      // После успешного линка — полезно обновить список первой страницей (там ещё есть поиск)
      await get().fetchList(groupId, { reset: true })
      // И явно отмечаем restricted=true (после появления белого списка)
      set((state) => ({ restricted: { ...state.restricted, [groupId]: true } }))
    } catch (e: any) {
      set((state) => ({ error: { ...state.error, [groupId]: e?.message || "Не удалось привязать категорию" } }))
      throw e
    }
  },

  // Удалить категорию из белого списка
  async unlink(groupId, categoryId) {
    set((state) => ({ error: { ...state.error, [groupId]: null } }))
    try {
      await unlinkGroupCategory(groupId, categoryId)
      // Оптимистично убираем локально
      set((state) => {
        const list = (state.items[groupId] || []).filter((c) => c.id !== categoryId)
        const total = Math.max(0, (state.total[groupId] || 0) - 1)
        return { items: { ...state.items, [groupId]: list }, total: { ...state.total, [groupId]: total } }
      })
    } catch (e: any) {
      set((state) => ({ error: { ...state.error, [groupId]: e?.message || "Не удалось отвязать категорию" } }))
      throw e
    }
  },

  // Создать НОВУЮ глобальную категорию и сразу привязать к группе
  async createAndLink(groupId, payload) {
    set((state) => ({ error: { ...state.error, [groupId]: null } }))
    try {
      const created = await createAndLinkGroupCategory(groupId, payload)
      set((state) => {
        const list = [created, ...(state.items[groupId] || [])]
        const total = (state.total[groupId] || 0) + 1
        return {
          items: { ...state.items, [groupId]: list },
          total: { ...state.total, [groupId]: total },
          restricted: { ...state.restricted, [groupId]: true },
        }
      })
    } catch (e: any) {
      set((state) => ({ error: { ...state.error, [groupId]: e?.message || "Не удалось создать категорию" } }))
      throw e
    }
  },
}))
