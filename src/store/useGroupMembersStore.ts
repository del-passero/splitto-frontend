// src/store/useGroupMembersStore.ts

import { create } from "zustand"
import axios from "axios"
import type { GroupUser } from "../types/group"

/**
 * Zustand-стор для участников групп.
 * - Хранит участников по groupId (membersByGroup)
 * - Позволяет загружать, добавлять участников
 * - Не поддерживает удаление (по требованиям MVP)
 */

interface GroupMembersState {
  membersByGroup: Record<number, GroupUser[]>
  loading: boolean
  error: string | null

  fetchMembers: (groupId: number) => Promise<GroupUser[]>
  addMember: (groupId: number, user: GroupUser) => Promise<void>
  setMembersForGroup: (groupId: number, members: GroupUser[]) => void
}

export const useGroupMembersStore = create<GroupMembersState>((set, get) => ({
  membersByGroup: {},
  loading: false,
  error: null,

  // Загрузить участников для одной группы
  async fetchMembers(groupId) {
    set({ loading: true, error: null })
    try {
      const res = await axios.get(`/api/group_members/group/${groupId}`)
      // В ответе [{id, group_id, user: {...}}], вытаскиваем только user
      const members = res.data.map((item: any) => item.user)
      set(state => ({
        membersByGroup: { ...state.membersByGroup, [groupId]: members }
      }))
      return members
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || "Ошибка загрузки участников" })
      return []
    } finally {
      set({ loading: false })
    }
  },

  // Добавить участника в группу
  async addMember(groupId, user) {
    set({ loading: true, error: null })
    try {
      await axios.post("/api/group_members/", { group_id: groupId, user_id: user.id })
      await get().fetchMembers(groupId)
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || "Ошибка добавления участника" })
    } finally {
      set({ loading: false })
    }
  },

  // Локально обновить участников (например, после редактирования)
  setMembersForGroup(groupId, members) {
    set(state => ({
      membersByGroup: { ...state.membersByGroup, [groupId]: members }
    }))
  }
}))
