// src/store/settingsStore.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

// Четкие типы тем и языков
export type Theme = "auto" | "light" | "dark"
export type Lang = "auto" | "ru" | "en" | "es"

interface SettingsStore {
  theme: Theme
  lang: Lang
  setTheme: (theme: Theme) => void
  setLang: (lang: Lang) => void
}

// Zustand store с persist
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      theme: "auto",
      lang: "auto",
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
    }),
    {
      name: "settings-storage", // имя в localStorage
    }
  )
)
