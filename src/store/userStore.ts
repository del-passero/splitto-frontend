// src/store/userStore.ts
import { create } from "zustand"
import type { User } from "../types/user"

// Store для пользователя (Telegram WebApp)
interface UserStore {
  user: User | null
  setUser: (user: User | null) => void
}

export const useUserStore = create<UserStore>(set => ({
  user: null,
  setUser: (user) => set({ user }),
}))
