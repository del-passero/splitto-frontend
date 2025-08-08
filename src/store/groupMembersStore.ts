// src/store/groupMembersStore.ts
// Zustand-стор участников конкретной группы. Под новый backend добавлены экшены:
//  • addMember(userId) — может любой участник активной группы
//  • removeMember(memberId) — только владелец (бэк проверит)
//  • leaveGroup(currentUserId) — выйти из группы (владелец не может; 409 если есть не удалённые транзакции)

import { create } from "zustand"
import type { GroupMember } from "../types/group_member"
import {
  getGroupMembers,
  addGroupMember as addGroupMemberApi,
  removeGroupMember as removeGroupMemberApi,
  leaveGroup as leaveGroupApi,
} from "../api/groupMembersApi"

interface GroupMembersStore {
  groupId: number | null

  members: GroupMember[]
  total: number

  loading: boolean
  error: string | null

  page: number
  hasMore: boolean

  setGroupId: (groupId: number) => void
  setPage: (p: number) => void

  fetchMembers: (offset?: number, limit?: number) => Promise<void>
  addMember: (userId: number) => Promise<void>
  removeMember: (memberId: number) => Promise<void>
  leaveGroup: (currentUserId: number) => Promise<void>

  clearMembers: () => void
}

const PAGE_SIZE = 20

export const useGroupMembersStore = create<GroupMembersStore>((set, get) => ({
  groupId: null,
  members: [],
  total: 0,
  loading: false,
  error: null,
  page: 0,
  hasMore: true,

  setGroupId(groupId: number) {
    set({ groupId, members: [], total: 0, page: 0, hasMore: true, error: null })
  },

  setPage(p: number) {
    set({ page: p })
  },

  async fetchMembers(offset = 0, limit = PAGE_SIZE) {
    set({ loading: true, error: null })
    try {
      const { groupId, members } = get()
      if (!groupId) throw new Error("groupId is not set")
      const data = await getGroupMembers(groupId, offset, limit)
      set({
        members: offset === 0 ? data.items : [...members, ...data.items],
        total: data.total,
        loading: false,
        hasMore: offset + (data.items?.length || 0) < data.total,
      })
    } catch (e: any) {
      set({ error: e.message || "Ошибка загрузки участников", loading: false })
    }
  },

  // Добавить участника (успешно — пушим в список и увеличиваем total)
  async addMember(userId: number) {
    set({ error: null })
    const { groupId, members } = get()
    if (!groupId) throw new Error("groupId is not set")
    try {
      const gm = await addGroupMemberApi({ group_id: groupId, user_id: userId })
      set({ members: [gm, ...members], total: get().total + 1 })
    } catch (e: any) {
      set({ error: e.message || "Не удалось добавить участника" })
      throw e
    }
  },

  // Удалить участника (только владелец; успешный ответ — 204)
  async removeMember(memberId: number) {
    set({ error: null })
    const { members, total } = get()
    try {
      await removeGroupMemberApi(memberId)
      set({
        members: members.filter((m) => m.id !== memberId),
        total: Math.max(0, total - 1),
      })
    } catch (e: any) {
      set({ error: e.message || "Не удалось удалить участника" })
      throw e
    }
  },

  // Выйти из группы (self-leave). Бэк вернёт 409 если есть не удалённые транзакции, 409 если владелец.
  async leaveGroup(currentUserId: number) {
    set({ error: null })
    const { groupId, members, total } = get()
    if (!groupId) throw new Error("groupId is not set")
    try {
      await leaveGroupApi(groupId)
      set({
        members: members.filter((m) => m.user.id !== currentUserId),
        total: Math.max(0, total - 1),
      })
    } catch (e: any) {
      set({ error: e.message || "Не удалось выйти из группы" })
      throw e
    }
  },

  clearMembers() {
    set({ members: [], total: 0, page: 0, hasMore: true, error: null })
  },
}))
