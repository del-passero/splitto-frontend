// src/store/friendsStore.ts

import { create } from "zustand"
import { Friend } from "../types/friend"
import { getFriends } from "../api/friendsApi"

// Тип Zustand-хранилища для друзей
interface FriendsStore {
  friends: Friend[]
  loading: boolean
  error: string | null
  fetchFriends: () => Promise<void>
}

export const useFriendsStore = create<FriendsStore>((set) => ({
  friends: [],
  loading: false,
  error: null,
  // Метод загрузки друзей из API
  async fetchFriends() {
    set({ loading: true, error: null })
    try {
      const data = await getFriends()
      set({ friends: data, loading: false })
    } catch (e: any) {
      set({ error: e.message || "Ошибка загрузки друзей", loading: false })
    }
  }
}))
