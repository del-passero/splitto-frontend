// src/store/useGroupsStore.ts

import { create } from "zustand"
import * as api from "../api/groupsApi"
import type { Group, GroupCreate } from "../types/group"

/**
 * Zustand-стор для работы со списком групп пользователя.
 * - Хранит массив групп
 * - Позволяет загружать, создавать, редактировать, удалять группы
 * - Интегрирован с backend API
 */
interface GroupsState {
  groups: Group[]
  loading: boolean
  error: string | null

  fetchGroups: (userId: number) => Promise<void>
  createGroup: (data: GroupCreate) => Promise<Group | null>
  updateGroup: (groupId: number, data: Partial<GroupCreate>) => Promise<Group | null>
  deleteGroup: (groupId: number) => Promise<void>
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  loading: false,
  error: null,

  // Загрузка всех групп пользователя
  async fetchGroups(userId) {
    set({ loading: true, error: null })
    try {
      const groups = await api.getGroupsByUser(userId)
      set({ groups })
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || "Ошибка загрузки групп" })
    } finally {
      set({ loading: false })
    }
  },

  // Создание новой группы
  async createGroup(data) {
    set({ loading: true, error: null })
    try {
      const group = await api.createGroup(data)
      set({ groups: [group, ...get().groups] })
      return group
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || "Ошибка создания группы" })
      return null
    } finally {
      set({ loading: false })
    }
  },

  // Обновление группы (название, описание)
  async updateGroup(groupId, data) {
    set({ loading: true, error: null })
    try {
      const updated = await api.updateGroup(groupId, data)
      set({
        groups: get().groups.map(g => (g.id === groupId ? updated : g)),
      })
      return updated
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || "Ошибка обновления группы" })
      return null
    } finally {
      set({ loading: false })
    }
  },

  // Удаление группы
  async deleteGroup(groupId) {
    set({ loading: true, error: null })
    try {
      await api.deleteGroup(groupId)
      set({ groups: get().groups.filter(g => g.id !== groupId) })
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || "Ошибка удаления группы" })
    } finally {
      set({ loading: false })
    }
  },
}))
