// src/store/settingsStore.ts
import { create } from "zustand"

// Определяем типы темы и языка
export type Theme = "auto" | "light" | "dark"
export type Lang = "auto" | "ru" | "en" | "es"

interface SettingsState {
  theme: Theme
  lang: Lang
  setTheme: (theme: Theme) => void
  setLang: (lang: Lang) => void
}

// Начальные значения - auto (наследование из Telegram)
export const useSettingsStore = create<SettingsState>(set => ({
  theme: "auto",
  lang: "auto",
  setTheme: (theme) => {
    set({ theme })
    localStorage.setItem("theme", theme)
  },
  setLang: (lang) => {
    set({ lang })
    localStorage.setItem("lang", lang)
  },
}))
