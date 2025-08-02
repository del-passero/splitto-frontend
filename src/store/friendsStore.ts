import { create } from "zustand"
import { Friend } from "../types/friend"
import { getFriends, getFriendsPaginated } from "../api/friendsApi"

interface FriendsStore {
  friends: Friend[]
  total: number | null
  loading: boolean
  error: string | null
  fetchFriends: () => Promise<void>
  fetchFriendsPaginated: (offset?: number, limit?: number) => Promise<void>
}

export const useFriendsStore = create<FriendsStore>((set) => ({
  friends: [],
  total: null,
  loading: false,
  error: null,
  async fetchFriends() {
    set({ loading: true, error: null })
    try {
      const data = await getFriends()
      set({ friends: data, loading: false, total: data.length })
    } catch (e: any) {
      set({ error: e.message || "Ошибка загрузки друзей", loading: false })
    }
  },
  async fetchFriendsPaginated(offset = 0, limit = 20) {
    set({ loading: true, error: null })
    try {
      const result = await getFriendsPaginated({ offset, limit })
      set({ friends: result.friends, loading: false, total: result.total })
    } catch (e: any) {
      set({ error: e.message || "Ошибка загрузки друзей", loading: false })
    }
  }
}))
