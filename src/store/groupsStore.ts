// src/store/groupsStore.ts
// Zustand-стор для групп: пагинация + серверный поиск (как friendsStore)

import { create } from "zustand"
import type { GroupPreview } from "../types/group"
import { getUserGroups } from "../api/groupsApi"

interface FetchOpts {
  reset?: boolean
  q?: string
}

interface GroupsStoreState {
  groups: GroupPreview[]
  groupsTotal: number
  groupsOffset: number
  groupsHasMore: boolean
  groupsLoading: boolean
  groupsError: string | null

  fetchGroups: (userId: number, opts?: FetchOpts) => Promise<void>
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

    // offset для запроса
    const offset = reset ? 0 : state.groupsOffset
    const limit = PAGE_SIZE

    // лок загрузки
    set({ groupsLoading: true, groupsError: null })

    try {
      // getUserGroups ДОЛЖЕН вернуть { items, total }.
      // Внутри он может читать X-Total-Count из заголовка /user/{id}.
      const { items, total }: { items: GroupPreview[]; total: number } =
        await getUserGroups(userId, { limit, offset, q })

      const next = reset ? items : [...state.groups, ...items.filter(i => !state.groups.some(g => g.id === i.id))]
      const nextOffset = reset ? items.length : next.length

      // hasMore: до тех пор, пока догружаем меньше total
      // если total отсутствует (на всякий) — fallback по размеру страницы
      const t = typeof total === "number" ? total : next.length
      const hasMore = typeof total === "number"
        ? next.length < total
        : items.length === limit

      set({
        groups: next,
        groupsTotal: t,
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
