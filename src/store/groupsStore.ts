// src/store/groupsStore.ts

/**
 * Zustand-store для загрузки, хранения и фильтрации групп пользователя и деталей группы.
 * Поддерживает: получение списка групп, детальную инфу о группе (с поддержкой пагинации участников),
 * универсальную обработку ошибок и загрузку.
 * Тексты для ошибок/лоадеров — через i18n в компонентах.
 */

import { create } from "zustand"
import type { Group, GroupPreview } from "../types/group"
import type { GroupMember } from "../types/group_member"
import {
  getUserGroups,
  getGroupDetails,
  getGroupMembersPaginated,
} from "../api/groupsApi"

interface GroupsStoreState {
  groups: GroupPreview[]            // Список всех групп пользователя с превью (экономит память)
  groupsLoading: boolean
  groupsError: string | null

  selectedGroup: Group | null       // Детальная информация о выбранной группе (полная структура)
  groupLoading: boolean
  groupError: string | null

  groupMembers: GroupMember[]       // Все подгруженные участники выбранной группы (инкрементально)
  groupMembersTotal: number         // Сколько всего участников в группе (для пагинации)
  groupMembersLoading: boolean
  groupMembersError: string | null

  fetchGroups: (userId: number) => Promise<void>
  fetchGroupDetails: (groupId: number, offset?: number, limit?: number) => Promise<void>
  fetchGroupMembers: (groupId: number, offset?: number, limit?: number) => Promise<void>

  clearSelectedGroup: () => void
  clearGroupMembers: () => void
}

const DEFAULT_LIMIT = 20

export const useGroupsStore = create<GroupsStoreState>((set) => ({
  groups: [],
  groupsLoading: false,
  groupsError: null,

  selectedGroup: null,
  groupLoading: false,
  groupError: null,

  groupMembers: [],
  groupMembersTotal: 0,
  groupMembersLoading: false,
  groupMembersError: null,

  // Загрузка всех групп пользователя (превью)
  async fetchGroups(userId) {
    set({ groupsLoading: true, groupsError: null })
    try {
      const data = await getUserGroups(userId)
      set({ groups: data, groupsLoading: false, groupsError: null })
    } catch (e: any) {
      set({
        groups: [],
        groupsLoading: false,
        groupsError: e?.message || "Ошибка загрузки групп"
      })
    }
  },

  // Загрузка деталей выбранной группы (можно с пагинацией участников)
  async fetchGroupDetails(groupId, offset = 0, limit = DEFAULT_LIMIT) {
    set({ groupLoading: true, groupError: null, selectedGroup: null })
    try {
      const data = await getGroupDetails(groupId, offset, limit)
      set({ selectedGroup: data, groupLoading: false, groupError: null })
    } catch (e: any) {
      set({
        selectedGroup: null,
        groupLoading: false,
        groupError: e?.message || "Ошибка загрузки группы"
      })
    }
  },

  // Пагинированная загрузка участников выбранной группы (инкрементально)
  async fetchGroupMembers(groupId, offset = 0, limit = DEFAULT_LIMIT) {
    if (offset === 0) {
      set({ groupMembers: [], groupMembersTotal: 0, groupMembersError: null })
    }
    set({ groupMembersLoading: true })
    try {
      const res = await getGroupMembersPaginated(groupId, offset, limit)
      set((state) => ({
        groupMembers: offset === 0
          ? res.items
          : [...state.groupMembers, ...res.items],
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

  // Сброс выбранной группы
  clearSelectedGroup() {
    set({ selectedGroup: null, groupLoading: false, groupError: null })
  },

  // Сброс участников группы
  clearGroupMembers() {
    set({ groupMembers: [], groupMembersTotal: 0, groupMembersLoading: false, groupMembersError: null })
  },
}))
