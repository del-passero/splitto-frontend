// src/store/groupsStore.ts
// Пагинация + серверный поиск, защита от гонок и корректный offset.
// Храним фильтры/сорт/поиск в сторе. fetchGroups/рефреш используют текущие значения.
// Добавлено: хранение превью-долгов и загрузка батчем.
// Обновлено: helper для локального обновления алгоритма settle_algorithm в списке групп.

import { create } from "zustand"
import type { GroupPreview, SettleAlgorithm } from "../types/group"
import { getUserGroups, getDebtsPreview } from "../api/groupsApi"

interface DebtsMap {
  [groupId: number]: { owe?: Record<string, number>; owed?: Record<string, number> }
}

interface FetchOpts {
  reset?: boolean
  q?: string
  includeHidden?: boolean
  includeArchived?: boolean
  includeDeleted?: boolean
  sortBy?: "last_activity" | "name" | "created_at" | "members_count"
  sortDir?: "asc" | "desc"
}

interface GroupsStoreState {
  groups: GroupPreview[]
  groupsTotal: number
  groupsOffset: number
  groupsHasMore: boolean
  groupsLoading: boolean
  groupsError: string | null
  reqId: number

  // фильтры/сорт/поиск
  includeHidden: boolean
  includeArchived: boolean
  includeDeleted: boolean
  sortBy: "last_activity" | "name" | "created_at" | "members_count"
  sortDir: "asc" | "desc"
  search: string

  setFilters: (f: { includeHidden?: boolean; includeArchived?: boolean; includeDeleted?: boolean }) => void
  setSort: (s: { sortBy?: GroupsStoreState["sortBy"]; sortDir?: GroupsStoreState["sortDir"] }) => void
  setSearch: (q: string) => void

  // превью долгов
  debtsPreviewByGroupId: DebtsMap

  clearGroups: () => void
  fetchGroups: (userId: number, opts?: FetchOpts) => Promise<void>
  loadMoreGroups: (userId: number, opts?: Omit<FetchOpts, "reset">) => Promise<void>

  // батч-загрузка превью долгов для карточек
  fetchDebtsPreview: (groupIds: number[]) => Promise<void>

  // локальный апдейт метаданных группы (минимально — алгоритм)
  updateGroupAlgorithm: (groupId: number, algo: SettleAlgorithm) => void
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

  includeHidden: false,
  includeArchived: false,
  includeDeleted: false,
  sortBy: "last_activity",
  sortDir: "desc",
  search: "",

  setFilters(f) {
    set({
      includeHidden:  f.includeHidden  ?? get().includeHidden,
      includeArchived:f.includeArchived?? get().includeArchived,
      includeDeleted: f.includeDeleted ?? get().includeDeleted,
    })
  },
  setSort(s) {
    set({
      sortBy: s.sortBy ?? get().sortBy,
      sortDir: s.sortDir ?? get().sortDir,
    })
  },
  setSearch(q) {
    set({ search: q })
  },

  debtsPreviewByGroupId: {},

  clearGroups() {
    set({
      groups: [],
      groupsTotal: 0,
      groupsOffset: 0,
      groupsHasMore: true,
      groupsError: null,
      // reqId не сбрасываем, чтобы старые ответы не перетёрли новые
      debtsPreviewByGroupId: {},
    })
  },

  async fetchGroups(userId, opts) {
    const state = get()
    const reset = !!opts?.reset

    const q               = (opts?.q ?? state.search)?.trim() || undefined
    const includeHidden   = opts?.includeHidden   ?? state.includeHidden
    const includeArchived = opts?.includeArchived ?? state.includeArchived
    const includeDeleted  = opts?.includeDeleted  ?? state.includeDeleted
    const sortBy          = opts?.sortBy          ?? state.sortBy
    const sortDir         = opts?.sortDir         ?? state.sortDir

    const myId = state.reqId + 1
    set({ reqId: myId, groupsLoading: true, groupsError: null })

    const reqOffset = reset ? 0 : state.groupsOffset
    const limit = PAGE_SIZE

    try {
      const { items, total } = await getUserGroups(userId, {
        limit,
        offset: reqOffset,
        q,
        includeHidden,
        includeArchived,
        includeDeleted,
        sortBy,
        sortDir,
      })

      if (get().reqId !== myId) return

      const prev = reset ? [] : state.groups
      const uniq = items.filter((i) => !prev.some((g) => g.id === i.id))
      const merged = reset ? uniq : [...prev, ...uniq]

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

      // Подгрузим превью долгов для пришедшей страницы
      const ids = items.map(i => i.id)
      if (ids.length > 0) {
        try {
          const map = await getDebtsPreview(userId, ids)
          const patch: DebtsMap = {}
          Object.keys(map || {}).forEach(k => {
            const num = Number(k)
            if (Number.isFinite(num)) patch[num] = map[k]
          })
          set({ debtsPreviewByGroupId: { ...get().debtsPreviewByGroupId, ...patch } })
        } catch {
          // превью долгов — вторично, не ломаем загрузку
        }
      }
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

  async loadMoreGroups(userId, opts) {
    const { groupsHasMore, groupsLoading } = get()
    if (!groupsHasMore || groupsLoading) return
    await get().fetchGroups(userId, { reset: false, ...(opts || {}) })
  },

  async fetchDebtsPreview(groupIds) {
    const cached = get().debtsPreviewByGroupId
    const miss = groupIds.filter((id) => !cached[id])
    if (miss.length === 0) return
    return
  },

  updateGroupAlgorithm(groupId, algo) {
    set({
      groups: get().groups.map(g =>
        g.id === groupId ? { ...g, settle_algorithm: algo } : g
      )
    })
  },
}))
