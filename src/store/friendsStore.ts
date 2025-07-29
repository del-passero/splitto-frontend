// src/store/friendsStore.ts

import { create } from "zustand"
import { Friend } from "../types/friend"
import * as friendsApi from "../api/friendsApi" // ����������� ��� ������ �� API

// ��� ��������� �����
interface FriendsState {
  friends: Friend[]              // ������ ������� ������
  hiddenFriends: Friend[]        // ������ ������� ������
  loading: boolean               // ������ ��������
  error: string | null           // ������ ��������

  // ������ �������� � ����������
  loadFriends: () => Promise<void>
  loadHiddenFriends: () => Promise<void>
  hideFriend: (friendId: number) => Promise<void>
  unhideFriend: (friendId: number) => Promise<void>
  // ����� �������� ������ ��� ��������, ���������� � �.�.
}

// Zustand store ��� ���������� ������� ������ � ������� ������
export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  hiddenFriends: [],
  loading: false,
  error: null,

  // �������� ������� ������ (hidden = false)
  loadFriends: async () => {
    set({ loading: true, error: null })
    try {
      const friends = await friendsApi.getFriends(false)
      set({ friends, loading: false })
    } catch (e: any) {
      set({ error: e.message || "������ �������� ������", loading: false })
    }
  },

  // �������� ������� ������ (hidden = true)
  loadHiddenFriends: async () => {
    set({ loading: true, error: null })
    try {
      const hiddenFriends = await friendsApi.getFriends(true)
      set({ hiddenFriends, loading: false })
    } catch (e: any) {
      set({ error: e.message || "������ �������� ������� ������", loading: false })
    }
  },

  // ������ �����
  hideFriend: async (friendId: number) => {
    set({ loading: true, error: null })
    try {
      await friendsApi.hideFriend(friendId)
      // ����� �������� � ������������� ��� ������
      await get().loadFriends()
      await get().loadHiddenFriends()
      set({ loading: false })
    } catch (e: any) {
      set({ error: e.message || "������ ������� �����", loading: false })
    }
  },

  // �������� �������� ����� (unhide)
  unhideFriend: async (friendId: number) => {
    set({ loading: true, error: null })
    try {
      await friendsApi.unhideFriend(friendId)
      await get().loadFriends()
      await get().loadHiddenFriends()
      set({ loading: false })
    } catch (e: any) {
      set({ error: e.message || "������ �������������� �����", loading: false })
    }
  },
}))
