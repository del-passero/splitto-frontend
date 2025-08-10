// src/store/groupsStore.ts
// Zustand-стор для групп: пагинация + ПОИСК с сервера (как friendsStore)

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

  fetchGroups: (userId: number, opts?: { reset?: boolean; q?: string }) => Promise<void>
  loadMoreGroups: (userId: number, q?: string) => Promise<void>
  clearGroups: () => void
}

const PAGE_SIZE = 20

export const useGroupsStore = create<GroupsStoreState>((set, get) => ({
  groups: [],
  groupsTotal: 0,
  groupsOffset: 0,
  groupsHasMore: true,
  groupsLoading: false,
  groupsError: null,

  clearGroups() {
    set({ groups: [], groupsTotal: 0, groupsOffset: 0, groupsHasMore: true, groupsError: null })
  },

  async fetchGroups(userId, opts) {
    const state = get()
    const reset = !!opts?.reset
    const q = opts?.q?.trim() || undefined

    const offset = reset ? 0 : state.groupsOffset
    const limit = PAGE_SIZE

    set({ groupsLoading: true, groupsError: null })

    try {
      const { items, total } = await getUserGroups(userId, { limit, offset, q })
      const merged = reset
        ? items
        : [...state.groups, ...items.filter(i => !state.groups.some(g => g.id === i.id))]

      const nextOffset = merged.length
      const hasMore = typeof total === "number" ? nextOffset < total : items.length === limit

      set({
        groups: merged,
        groupsTotal: typeof total === "number" ? total : merged.length,
        groupsOffset: nextOffset,
        groupsHasMore: hasMore,
      })
    } catch (e: any) {
      set({
        groupsLoading: false,
        groupsError: e?.message || "Ошибка загрузки групп",
        groupsHasMore: false,
      })
      return
    } finally {
      set({ groupsLoading: false })
    }
  },

  async loadMoreGroups(userId, q) {
    const { groupsHasMore, groupsLoading } = get()
    if (!groupsHasMore || groupsLoading) return
    await get().fetchGroups(userId, { reset: false, q })
  },
}))
