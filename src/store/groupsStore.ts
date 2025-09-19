// src/store/groupsStore.ts
// Пагинация + серверный поиск, защита от гонок и корректный offset.
// Добавлено: хранение превью-долгов и загрузка батчем.
// Расширено: fetchGroups принимает includeHidden/includeArchived/sortBy/sortDir.

import { create } from "zustand"
import type { GroupPreview } from "../types/group"
import { getUserGroups, getDebtsPreview } from "../api/groupsApi"

interface DebtsMap {
  [groupId: number]: { owe?: Record<string, number>; owed?: Record<string, number> }
}

interface GroupsStoreState {
  groups: GroupPreview[]
  groupsTotal: number
  groupsOffset: number
  groupsHasMore: boolean
  groupsLoading: boolean
  groupsError: string | null
  reqId: number

  // превью долгов
  debtsPreviewByGroupId: DebtsMap

  clearGroups: () => void
  fetchGroups: (userId: number, opts?: {
    reset?: boolean
    q?: string
    includeHidden?: boolean
    includeArchived?: boolean
    sortBy?: "last_activity" | "name" | "created_at" | "members_count"
    sortDir?: "asc" | "desc"
  }) => Promise<void>
  loadMoreGroups: (userId: number, q?: string) => Promise<void>

  // батч-загрузка превью долгов для карточек
  fetchDebtsPreview: (groupIds: number[]) => Promise<void>
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
    const q = opts?.q?.trim() || undefined
    const includeHidden = !!opts?.includeHidden
    const includeArchived = !!opts?.includeArchived
    const sortBy = opts?.sortBy
    const sortDir = opts?.sortDir

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
        includeHidden,
        includeArchived,
        sortBy,
        sortDir,
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

      // Подгрузим превью долгов для пришедшей страницы
      const ids = items.map(i => i.id)
      if (ids.length > 0) {
        try {
          const map = await getDebtsPreview(userId, ids)
          // Преобразуем ключи в number
          const patch: DebtsMap = {}
          Object.keys(map || {}).forEach(k => {
            const num = Number(k)
            if (Number.isFinite(num)) patch[num] = (map as any)[k]
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

  async loadMoreGroups(userId, q) {
    const { groupsHasMore, groupsLoading } = get()
    if (!groupsHasMore || groupsLoading) return
    await get().fetchGroups(userId, { reset: false, q })
  },

  async fetchDebtsPreview(groupIds) {
    // добираем превью только для тех id, которых ещё нет в кеше
    const cached = get().debtsPreviewByGroupId
    const miss = groupIds.filter((id) => !cached[id])
    if (miss.length === 0) return
    // Превью фактически подгружается в fetchGroups для каждой пришедшей страницы.
    // Здесь no-op для совместимости с циклом видимости карточек.
    return
  },
}))
