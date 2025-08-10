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

const DEFAULT_LIMIT = 20

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
    const isReset = !!opts?.reset
    const q = opts?.q?.trim() || undefined
    const offset = isReset ? 0 : state.groupsOffset
    const limit = DEFAULT_LIMIT

    if (isReset) {
      set({ groups: [], groupsTotal: 0, groupsOffset: 0, groupsHasMore: true })
    }

    set({ groupsLoading: true, groupsError: null })
    try {
      const { items, total } = await getUserGroups(userId, { limit, offset, q })
      set((s) => {
        const nextItems = offset === 0 ? items : [...s.groups, ...items]
        const nextOffset = offset + items.length
        const hasMore = nextOffset < total
        return {
          groups: nextItems,
          groupsTotal: total,
          groupsOffset: nextOffset,
          groupsHasMore: hasMore,
          groupsLoading: false,
          groupsError: null,
        }
      })
    } catch (e: any) {
      set({
        groupsLoading: false,
        groupsError: e?.message || "Ошибка загрузки групп",
        groupsHasMore: false,
      })
    }
  },

  async loadMoreGroups(userId, q) {
    const { groupsHasMore, groupsLoading } = get()
    if (!groupsHasMore || groupsLoading) return
    await get().fetchGroups(userId, { reset: false, q })
  },
}))
