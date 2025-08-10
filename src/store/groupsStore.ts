// src/store/groupsStore.ts
// Zustand-стор для групп: пагинация + серверный поиск.
// Фикс гонок: reqId — применяем только последний ответ.

import { create } from "zustand"
import type { GroupPreview } from "../types/group"
import { getUserGroups } from "../api/groupsApi"

interface GroupsStoreState {
  groups: GroupPreview[]
  groupsTotal: number
  groupsOffset: number
  groupsHasMore: boolean
  groupsLoading: boolean
  groupsError: string | null
  reqId: number

  clearGroups: () => void
  fetchGroups: (userId: number, opts?: { reset?: boolean; q?: string }) => Promise<void>
  loadMoreGroups: (userId: number, q?: string) => Promise<void>
}

const PAGE_SIZE = 20

export const useGroupsStore = create<GroupsStoreState>((set, get) => ({
  groups: [],
  groupsTotal: 0,
  groupsOffset: 0,
  groupsHasMore: true,
  groupsLoading: false,
  groupsError: null,
  reqId: 0,

  clearGroups() {
    set({
      groups: [],
      groupsTotal: 0,
      groupsOffset: 0,
      groupsHasMore: true,
      groupsError: null,
      // reqId не сбрасываем намеренно — чтобы старые ответы не перетёрли новый поиск
    })
  },

  async fetchGroups(userId, opts) {
    const state = get()
    const reset = !!opts?.reset
    const q = opts?.q?.trim() || undefined

    const myId = state.reqId + 1
    set({ reqId: myId, groupsLoading: true, groupsError: null })

    // offset для запроса
    const offset = reset ? 0 : state.groupsOffset
    const limit = PAGE_SIZE

    try {
      const { items, total } = await getUserGroups(userId, { limit, offset, q })

      // если уже стартовал следующий запрос — игнорим этот ответ
      if (get().reqId !== myId) return

      const prev = reset ? [] : state.groups
      // защита от дублей
      const newItems = items.filter(i => !prev.some(g => g.id === i.id))
      const merged = reset ? newItems : [...prev, ...newItems]

      const nextOffset = merged.length
      const t = Number.isFinite(total) ? total : merged.length
      const nextHasMore = Number.isFinite(total)
        ? nextOffset < t
        : items.length === limit

      set({
        groups: merged,
        groupsTotal: t,
        groupsOffset: nextOffset,
        groupsHasMore: nextHasMore,
      })
    } catch (e: any) {
      if (get().reqId !== myId) return
      set({
        groupsLoading: false,
        groupsError: e?.message || "Ошибка загрузки групп",
        groupsHasMore: false,
      })
      return
    } finally {
      if (get().reqId === myId) {
        set({ groupsLoading: false })
      }
    }
  },

  async loadMoreGroups(userId, q) {
    const { groupsHasMore, groupsLoading } = get()
    if (!groupsHasMore || groupsLoading) return
    await get().fetchGroups(userId, { reset: false, q })
  },
}))
