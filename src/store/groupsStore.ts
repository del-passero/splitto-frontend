// src/store/groupsStore.ts

/**
 * Zustand-store для загрузки, хранения и фильтрации групп пользователя.
 * Используется для работы страницы групп и деталей группы.
 * Все тексты для ошибок/лоадеров выводятся через i18n в компонентах.
 */

import { create } from "zustand"
import type { Group } from "../types/group"
import { getUserGroups, getGroupDetails } from "../api/groupsApi"

interface GroupsStoreState {
  groups: Group[]                 // Список всех групп пользователя
  groupsLoading: boolean          // Индикатор загрузки групп
  groupsError: string | null      // Сообщение об ошибке загрузки групп

  selectedGroup: Group | null     // Детальная информация о выбранной группе
  groupLoading: boolean           // Индикатор загрузки группы
  groupError: string | null       // Сообщение об ошибке загрузки группы

  fetchGroups: (userId: number) => Promise<void>              // Загрузить все группы пользователя
  fetchGroupDetails: (groupId: number) => Promise<void>        // Загрузить детали конкретной группы

  clearSelectedGroup: () => void                              // Сбросить выбранную группу
}

export const useGroupsStore = create<GroupsStoreState>((set) => ({
  groups: [],
  groupsLoading: false,
  groupsError: null,

  selectedGroup: null,
  groupLoading: false,
  groupError: null,

  // Загрузка всех групп пользователя
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

  // Загрузка деталей выбранной группы
  async fetchGroupDetails(groupId) {
    set({ groupLoading: true, groupError: null, selectedGroup: null })
    try {
      const data = await getGroupDetails(groupId)
      set({ selectedGroup: data, groupLoading: false, groupError: null })
    } catch (e: any) {
      set({
        selectedGroup: null,
        groupLoading: false,
        groupError: e?.message || "Ошибка загрузки группы"
      })
    }
  },

  // Сброс выбранной группы
  clearSelectedGroup() {
    set({ selectedGroup: null, groupLoading: false, groupError: null })
  }
}))
