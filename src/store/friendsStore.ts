// src/store/friendsStore.ts

import { create } from "zustand"
import { Friend } from "../types/friend"
import { getFriends, searchFriends } from "../api/friendsApi"

interface FriendsStore {
  friends: Friend[]
  total: number
  loading: boolean
  error: string | null
  showHidden: boolean
  page: number
  hasMore: boolean
  setShowHidden: (val: boolean) => void
  setPage: (p: number) => void
  fetchFriends: (offset?: number, limit?: number) => Promise<void>
  searchFriends: (query: string, offset?: number, limit?: number) => Promise<void>
  clearFriends: () => void
}

const PAGE_SIZE = 20

export const useFriendsStore = create<FriendsStore>((set, get) => ({
  friends: [],
  total: 0,
  loading: false,
  error: null,
  showHidden: false,
  page: 0,
  hasMore: true,

  setShowHidden(val: boolean) {
    set({ showHidden: val, friends: [], total: 0, page: 0, hasMore: true })
  },

  setPage(p: number) {
    set({ page: p })
  },

  async fetchFriends(offset = 0, limit = PAGE_SIZE) {
    set({ loading: true, error: null })
    try {
      const { showHidden, friends } = get()
      const data = await getFriends(showHidden, offset, limit)
      set({
        friends: offset === 0 ? data.friends : [...friends, ...data.friends],
        total: data.total,
        loading: false,
        hasMore: offset + data.friends.length < data.total
      })
    } catch (e: any) {
      set({ error: e.message || "Ошибка загрузки друзей", loading: false })
    }
  },

  async searchFriends(query, offset = 0, limit = PAGE_SIZE) {
    set({ loading: true, error: null })
    try {
      const { showHidden, friends } = get()
      const data = await searchFriends(query, showHidden, offset, limit)
      set({
        friends: offset === 0 ? data.friends : [...friends, ...data.friends],
        total: data.total,
        loading: false,
        hasMore: offset + data.friends.length < data.total
      })
    } catch (e: any) {
      set({ error: e.message || "Ошибка поиска друзей", loading: false })
    }
  },

  clearFriends() {
    set({ friends: [], total: 0, page: 0, hasMore: true })
  }
}))
