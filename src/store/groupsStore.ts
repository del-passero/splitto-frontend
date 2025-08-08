// src/store/groupsStore.ts
// Zustand-стор групп. Обновлено под новый backend:
//  • /groups/user/{id} теперь с limit/offset и X-Total-Count → добавлены поля total/limit/offset/hasMore и фильтры includeHidden/includeArchived
//  • fetchGroups(userId) теперь тянет {items,total} и кладёт в state.groups и state.groupsTotal
//  • добавлен loadMoreGroups(userId) для дозагрузки страниц
//  • fetchGroupMembers теперь использует groupMembersApi.getGroupMembers (вместо старого getGroupMembersPaginated), формат {items,total} сохранён

import { create } from "zustand"
import type { Group, GroupPreview } from "../types/group"
import type { GroupMember } from "../types/group_member"
import { getUserGroups, getGroupDetails } from "../api/groupsApi"
import { getGroupMembers as getGroupMembersApi } from "../api/groupMembersApi"

interface GroupsStoreState {
  // ——— список моих групп (превью) + пагинация
  groups: GroupPreview[]
  groupsTotal: number
  groupsLimit: number
  groupsOffset: number
  groupsHasMore: boolean
  includeHidden: boolean
  includeArchived: boolean
  groupsLoading: boolean
  groupsError: string | null

  // ——— выбранная группа (детали)
  selectedGroup: Group | null
  groupLoading: boolean
  groupError: string | null

  // ——— участники выбранной группы (локальный список здесь оставляем, чтобы ничего не сломать)
  groupMembers: GroupMember[]
  groupMembersTotal: number
  groupMembersLoading: boolean
  groupMembersError: string | null

  // ——— экшены
  fetchGroups: (userId: number, opts?: { reset?: boolean }) => Promise<void>
  loadMoreGroups: (userId: number) => Promise<void>
  setGroupsFilters: (params: { includeHidden?: boolean; includeArchived?: boolean; limit?: number }) => void

  fetchGroupDetails: (groupId: number, offset?: number, limit?: number) => Promise<void>
  fetchGroupMembers: (groupId: number, offset?: number, limit?: number) => Promise<void>

  clearSelectedGroup: () => void
  clearGroupMembers: () => void
}

const DEFAULT_LIMIT = 20

export const useGroupsStore = create<GroupsStoreState>((set, get) => ({
  // ——— init
  groups: [],
  groupsTotal: 0,
  groupsLimit: DEFAULT_LIMIT,
  groupsOffset: 0,
  groupsHasMore: true,
  includeHidden: false,
  includeArchived: false,
  groupsLoading: false,
  groupsError: null,

  selectedGroup: null,
  groupLoading: false,
  groupError: null,

  groupMembers: [],
  groupMembersTotal: 0,
  groupMembersLoading: false,
  groupMembersError: null,

  // Обновить фильтры и лимит; сбрасываем список и offset
  setGroupsFilters(params) {
    const { includeHidden, includeArchived, limit } = params
    set((state) => ({
      includeHidden: includeHidden ?? state.includeHidden,
      includeArchived: includeArchived ?? state.includeArchived,
      groupsLimit: typeof limit === "number" ? limit : state.groupsLimit,
      groups: [],
      groupsTotal: 0,
      groupsOffset: 0,
      groupsHasMore: true,
    }))
  },

  // Загрузить список групп пользователя (первая страница по умолчанию)
  async fetchGroups(userId, opts) {
    const { groupsLimit, groupsOffset, includeHidden, includeArchived } = get()
    // Если reset — очищаем и тянем с offset=0
    const isReset = !!opts?.reset
    const limit = groupsLimit
    const offset = isReset ? 0 : groupsOffset

    if (isReset) {
      set({ groups: [], groupsTotal: 0, groupsOffset: 0, groupsHasMore: true })
    }

    set({ groupsLoading: true, groupsError: null })
    try {
      const { items, total } = await getUserGroups(userId, {
        limit,
        offset,
        includeHidden,
        includeArchived,
      })

      set((state) => {
        const nextItems = offset === 0 ? items : [...state.groups, ...items]
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

  // Дозагрузка следующей страницы
  async loadMoreGroups(userId) {
    const { groupsHasMore, groupsLoading } = get()
    if (!groupsHasMore || groupsLoading) return
    await get().fetchGroups(userId, { reset: false })
  },

  // Детали группы (offset/limit — пагинация участников, как и раньше)
  async fetchGroupDetails(groupId, offset = 0, limit = DEFAULT_LIMIT) {
    set({ groupLoading: true, groupError: null, selectedGroup: null })
    try {
      const data = await getGroupDetails(groupId, offset, limit)
      set({ selectedGroup: data, groupLoading: false, groupError: null })
    } catch (e: any) {
      set({
        selectedGroup: null,
        groupLoading: false,
        groupError: e?.message || "Ошибка загрузки группы",
      })
    }
  },

  // Используем актуальный эндпоинт groupMembersApi.getGroupMembers (возвращает {items,total})
  async fetchGroupMembers(groupId, offset = 0, limit = DEFAULT_LIMIT) {
    if (offset === 0) {
      set({ groupMembers: [], groupMembersTotal: 0, groupMembersError: null })
    }
    set({ groupMembersLoading: true })
    try {
      const res = await getGroupMembersApi(groupId, offset, limit)
      set((state) => ({
        groupMembers: offset === 0 ? res.items : [...state.groupMembers, ...res.items],
        groupMembersTotal: res.total,
        groupMembersLoading: false,
        groupMembersError: null,
      }))
    } catch (e: any) {
      set({
        groupMembers: [],
        groupMembersTotal: 0,
        groupMembersLoading: false,
        groupMembersError: e?.message || "Ошибка загрузки участников группы",
      })
    }
  },

  clearSelectedGroup() {
    set({ selectedGroup: null, groupLoading: false, groupError: null })
  },

  clearGroupMembers() {
    set({
      groupMembers: [],
      groupMembersTotal: 0,
      groupMembersLoading: false,
      groupMembersError: null,
    })
  },
}))
