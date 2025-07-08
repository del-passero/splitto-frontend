// src/store/userStore.ts

/**
 * Zustand-store для глобального состояния пользователя.
 * Можно использовать, если нужно держать auth, user или связанные данные вне контекста React.
 */

import { create } from "zustand";
import type { User } from "../types/user";

interface UserStore {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
