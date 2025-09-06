// src/store/friendsStore.ts
import { create } from "zustand"
import type { Friend } from "../types/friend"
import type { User } from "../types/user"
import {
  getFriends,
  searchFriends,
  getFriendDetail,
  getCommonGroupNames,
  getFriendsOfUser,
  getUserProfilePublic,
} from "../api/friendsApi"

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

  // страница контакта
  contactFriend: Friend | null
  contactFriendLoading: boolean
  contactFriendError: string | null

  // фоллбек-профиль, если это НЕ друг (UserOut)
  contactUserFallback: User | null

  contactCommonGroupNames: string[]
  contactCommonGroupsLoading: boolean
  contactCommonGroupsError: string | null

  contactFriends: Friend[]
  contactTotal: number
  contactLoading: boolean
  contactError: string | null
  contactHasMore: boolean
  contactPage: number

  fetchFriendById: (friendId: number) => Promise<void>
  fetchCommonGroupNames: (friendId: number) => Promise<void>
  fetchFriendsOfUser: (userId: number, offset?: number, limit?: number) => Promise<void>
  clearContactFriends: () => void
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
        hasMore: offset + data.friends.length < data.total,
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
        hasMore: offset + data.friends.length < data.total,
      })
    } catch (e: any) {
      set({ error: e.message || "errors.friends_search", loading: false })
    }
  },

  clearFriends() {
    set({ friends: [], total: 0, page: 0, hasMore: true })
  },

  // ===== страница контакта =====
  contactFriend: null,
  contactFriendLoading: false,
  contactFriendError: null,

  contactUserFallback: null,

  contactCommonGroupNames: [],
  contactCommonGroupsLoading: false,
  contactCommonGroupsError: null,

  contactFriends: [],
  contactTotal: 0,
  contactLoading: false,
  contactError: null,
  contactHasMore: true,
  contactPage: 0,

  async fetchFriendById(friendId: number) {
    set({
      contactFriendLoading: true,
      contactFriendError: null,
      contactFriend: null,
      contactUserFallback: null,
    })
    try {
      const data = await getFriendDetail(friendId)
      set({ contactFriend: data, contactFriendLoading: false })
    } catch (e: any) {
      // Если не друг — пробуем публичный профиль
      try {
        const user = await getUserProfilePublic(friendId)
        set({
          contactUserFallback: user,
          contactFriendLoading: false,
        })
      } catch (e2: any) {
        set({
          contactFriendError: e2?.message || e?.message || "errors.contact_load",
          contactFriendLoading: false,
        })
      }
    }
  },

  async fetchCommonGroupNames(friendId: number) {
    set({ contactCommonGroupsLoading: true, contactCommonGroupsError: null })
    try {
      const names = await getCommonGroupNames(friendId)
      set({ contactCommonGroupNames: names, contactCommonGroupsLoading: false })
    } catch (e: any) {
      set({
        contactCommonGroupsError: e.message || "errors.common_groups_load",
        contactCommonGroupsLoading: false,
      })
    }
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
        contactPage: offset === 0 ? 0 : get().contactPage + 1,
      })
    } catch (e: any) {
      set({ contactError: e.message || "errors.contact_friends_load", contactLoading: false })
    }
  },

  clearContactFriends() {
    set({
      contactFriends: [],
      contactTotal: 0,
      contactLoading: false,
      contactError: null,
      contactHasMore: true,
      contactPage: 0,
      contactFriend: null,
      contactFriendError: null,
      contactFriendLoading: false,
      contactUserFallback: null,
      contactCommonGroupNames: [],
      contactCommonGroupsError: null,
      contactCommonGroupsLoading: false,
    })
  },
}))
