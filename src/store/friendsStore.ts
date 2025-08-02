import { create } from "zustand"
import { Friend } from "../types/friend"
import { getFriends } from "../api/friendsApi"

interface FriendsStore {
  friends: Friend[]
  total: number
  loading: boolean
  error: string | null
  fetchFriends: (offset?: number, limit?: number) => Promise<void>
}

export const useFriendsStore = create<FriendsStore>((set) => ({
  friends: [],
  total: 0,
  loading: false,
  error: null,
  async fetchFriends(offset = 0, limit = 20) {
    set({ loading: true, error: null })
    try {
      const data = await getFriends(false, offset, limit)
      set(state => ({
        friends: offset === 0 ? data.friends : [...state.friends, ...data.friends],
        total: data.total,
        loading: false
      }))
    } catch (e: any) {
      set({ error: e.message || "Ошибка загрузки друзей", loading: false })
    }
  }
}))
