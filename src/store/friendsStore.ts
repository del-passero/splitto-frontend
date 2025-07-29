// src/store/friendsStore.ts

import { create } from "zustand"
import { Friend } from "../types/friend"
import * as friendsApi from "../api/friendsApi" // импортируем все методы из API

// Тип состояния стора
interface FriendsState {
  friends: Friend[]              // Список обычных друзей
  hiddenFriends: Friend[]        // Список скрытых друзей
  loading: boolean               // Статус загрузки
  error: string | null           // Ошибка загрузки

  // Методы загрузки и управления
  loadFriends: () => Promise<void>
  loadHiddenFriends: () => Promise<void>
  hideFriend: (friendId: number) => Promise<void>
  unhideFriend: (friendId: number) => Promise<void>
  // Можно добавить методы для удаления, обновления и т.д.
}

// Zustand store для управления списком друзей и скрытых друзей
export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  hiddenFriends: [],
  loading: false,
  error: null,

  // Загрузка обычных друзей (hidden = false)
  loadFriends: async () => {
    set({ loading: true, error: null })
    try {
      const friends = await friendsApi.getFriends(false)
      set({ friends, loading: false })
    } catch (e: any) {
      set({ error: e.message || "Ошибка загрузки друзей", loading: false })
    }
  },

  // Загрузка скрытых друзей (hidden = true)
  loadHiddenFriends: async () => {
    set({ loading: true, error: null })
    try {
      const hiddenFriends = await friendsApi.getFriends(true)
      set({ hiddenFriends, loading: false })
    } catch (e: any) {
      set({ error: e.message || "Ошибка загрузки скрытых друзей", loading: false })
    }
  },

  // Скрыть друга
  hideFriend: async (friendId: number) => {
    set({ loading: true, error: null })
    try {
      await friendsApi.hideFriend(friendId)
      // После действия — перезагрузить оба списка
      await get().loadFriends()
      await get().loadHiddenFriends()
      set({ loading: false })
    } catch (e: any) {
      set({ error: e.message || "Ошибка скрытия друга", loading: false })
    }
  },

  // Показать скрытого друга (unhide)
  unhideFriend: async (friendId: number) => {
    set({ loading: true, error: null })
    try {
      await friendsApi.unhideFriend(friendId)
      await get().loadFriends()
      await get().loadHiddenFriends()
      set({ loading: false })
    } catch (e: any) {
      set({ error: e.message || "Ошибка восстановления друга", loading: false })
    }
  },
}))
