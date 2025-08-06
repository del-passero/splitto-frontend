// src/store/groupMembersStore.ts

import { create } from "zustand"
import type { GroupMember } from "../types/group_member"
import { getGroupMembers } from "../api/groupMembersApi"

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
    set({ groupId, members: [], total: 0, page: 0, hasMore: true })
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
        hasMore: offset + (data.items?.length || 0) < data.total
      })
    } catch (e: any) {
      set({ error: e.message || "Ошибка загрузки участников", loading: false })
    }
  },

  clearMembers() {
    set({ members: [], total: 0, page: 0, hasMore: true })
  }
}))
