// src/store/friendsStore.ts

import { create } from "zustand"
import { Friend } from "../types/friend"
import { getFriends } from "../api/friendsApi"

// ��� Zustand-��������� ��� ������
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
  // ����� �������� ������ �� API
  async fetchFriends() {
    set({ loading: true, error: null })
    try {
      const data = await getFriends()
      set({ friends: data, loading: false })
    } catch (e: any) {
      set({ error: e.message || "������ �������� ������", loading: false })
    }
  }
}))
