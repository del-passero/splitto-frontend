// src/store/userStore.ts
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User } from "../types/user"
import { authTelegramUserAuto, extractTgUserId, getTelegramInitData } from "../api/usersApi"
import { resetAllStores } from "./resetAllStores"

interface UserStore {
  user: User | null
  userKey?: string              // уникальный ключ per Telegram user (u_<tgId>)
  loading: boolean

  // Совместимость с твоим кодом
  setUser: (user: User | null) => void

  // Новое
  bootstrap: () => Promise<void> // авторизация и установка user+userKey
  logoutLocal: () => void        // локальный выход и ресет зависимых стора
}

const STORAGE_NAME = "splitto-user"
const STORAGE_VERSION = 1

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      userKey: undefined,
      loading: false,

      setUser(user) {
        set({ user })
      },

      async bootstrap() {
        const initData = getTelegramInitData()
        const nextTgId = extractTgUserId(initData)
        const nextKey = nextTgId ? `u_${nextTgId}` : undefined
        const prevKey = get().userKey

        // Сменился Telegram-пользователь? Сбросим завязанные persist-сторы.
        if (prevKey && nextKey && prevKey !== nextKey) {
          resetAllStores()
        }

        set({ loading: true })
        try {
          const me = await authTelegramUserAuto()
          set({ user: me, userKey: nextKey, loading: false })
        } catch (e) {
          set({ loading: false })
          throw e
        }
      },

      logoutLocal() {
        set({ user: null, userKey: undefined })
        resetAllStores()
      },
    }),
    {
      name: STORAGE_NAME,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // сохраняем только то, что реально нужно между сессиями
      partialize: (s) => ({ user: s.user, userKey: s.userKey }),
    }
  )
)
