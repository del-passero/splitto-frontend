// frontend/src/store/friendsStore.ts

import { create } from "zustand"
import { Friend } from "../types/friend"
import { getFriends, searchFriends, getFriend, getCommonGroupNames, getFriendsOfUser } from "../api/friendsApi"

interface FriendsStore {
  // список моих друзей
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

  // ===== Contact Details Page state =====
  contactFriend: Friend | null
  contactFriendLoading: boolean
  contactFriendError: string | null
  fetchFriendById: (friendId: number) => Promise<void>

  contactCommonGroupNames: string[]
  contactCommonGroupsLoading: boolean
  contactCommonGroupsError: string | null
  fetchCommonGroupNames: (friendId: number) => Promise<void>

  contactFriends: Friend[]
  contactTotal: number
  contactLoading: boolean
  contactError: string | null
  contactPage: number
  contactHasMore: boolean
  clearContactFriends: () => void
  fetchFriendsOfUser: (userId: number, offset?: number, limit?: number) => Promise<void>
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
      set({ error: e.message || "errors.friends_load", loading: false })
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
      set({ error: e.message || "errors.friends_search", loading: false })
    }
  },

  clearFriends() {
    set({ friends: [], total: 0, page: 0, hasMore: true })
  },

  // ===== Contact Details Page state & loaders =====
  contactFriend: null,
  contactFriendLoading: false,
  contactFriendError: null,
  async fetchFriendById(friendId: number) {
    set({ contactFriendLoading: true, contactFriendError: null })
    try {
      const data = await getFriend(friendId)
      set({ contactFriend: data, contactFriendLoading: false })
    } catch (e: any) {
      set({ contactFriendError: e.message || "errors.contact_load", contactFriendLoading: false })
    }
  },

  contactCommonGroupNames: [],
  contactCommonGroupsLoading: false,
  contactCommonGroupsError: null,
  async fetchCommonGroupNames(friendId: number) {
    set({ contactCommonGroupsLoading: true, contactCommonGroupsError: null })
    try {
      const names = await getCommonGroupNames(friendId)
      set({ contactCommonGroupNames: names, contactCommonGroupsLoading: false })
    } catch (e: any) {
      set({ contactCommonGroupsError: e.message || "errors.common_groups_load", contactCommonGroupsLoading: false })
    }
  },

  contactFriends: [],
  contactTotal: 0,
  contactLoading: false,
  contactError: null,
  contactPage: 0,
  contactHasMore: true,
  clearContactFriends() {
    set({ contactFriends: [], contactTotal: 0, contactPage: 0, contactHasMore: true })
  },
  async fetchFriendsOfUser(userId: number, offset = 0, limit = PAGE_SIZE) {
    set({ contactLoading: true, contactError: null })
    try {
      const { contactFriends } = get()
      const data = await getFriendsOfUser(userId, offset, limit)
      set({
        contactFriends: offset === 0 ? data.friends : [...contactFriends, ...data.friends],
        contactTotal: data.total,
        contactLoading: false,
        contactHasMore: offset + data.friends.length < data.total,
        contactPage: Math.floor((offset + data.friends.length) / limit)
      })
    } catch (e: any) {
      set({ contactError: e.message || "errors.contact_friends_load", contactLoading: false })
    }
  },
}))
