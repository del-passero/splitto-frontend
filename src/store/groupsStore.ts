// src/store/groupsStore.ts
// Пагинация + серверный поиск, защита от гонок и корректный offset.

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
      // reqId не сбрасываем, чтобы старые ответы не перетёрли новые
    })
  },

  async fetchGroups(userId, opts) {
    const state = get()
    const reset = !!opts?.reset
    const q = opts?.q?.trim() || undefined

    const myId = state.reqId + 1
    set({ reqId: myId, groupsLoading: true, groupsError: null })

    // ВАЖНО: offset для запроса — от предыдущего запроса, а не от длины merged
    const reqOffset = reset ? 0 : state.groupsOffset
    const limit = PAGE_SIZE

    try {
      const { items, total } = await getUserGroups(userId, {
        limit,
        offset: reqOffset,
        q,
      })

      // Если уже стартовал следующий запрос — игнорируем ответ
      if (get().reqId !== myId) return

      const prev = reset ? [] : state.groups
      // защитимся от дублей в UI
      const uniq = items.filter((i) => !prev.some((g) => g.id === i.id))
      const merged = reset ? uniq : [...prev, ...uniq]

      // Новый offset считаем ПО ПРИШЕДШЕЙ СТРАНИЦЕ, а не по merged:
      // так мы продвинемся дальше, даже если часть элементов повторилась.
      const newOffset = reqOffset + items.length

      const t = Number.isFinite(total) ? (total as number) : newOffset
      const nextHasMore = Number.isFinite(total)
        ? newOffset < (total as number)
        : items.length === limit

      set({
        groups: merged,
        groupsTotal: Number.isFinite(total) ? (total as number) : merged.length,
        groupsOffset: newOffset,
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
