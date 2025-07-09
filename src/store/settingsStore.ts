// src/store/settingsStore.ts
import { create } from "zustand"

export type Theme = "auto" | "light" | "dark"
export type Lang = "auto" | "ru" | "en" | "es"

interface SettingsState {
  theme: Theme
  lang: Lang
  setTheme: (theme: Theme) => void
  setLang: (lang: Lang) => void
}

const getInitTheme = (): Theme => (localStorage.getItem("theme") as Theme) || "auto"
const getInitLang = (): Lang => (localStorage.getItem("lang") as Lang) || "auto"

export const useSettingsStore = create<SettingsState>(set => ({
  theme: getInitTheme(),
  lang: getInitLang(),
  setTheme: (theme) => {
    set({ theme })
    localStorage.setItem("theme", theme)
  },
  setLang: (lang) => {
    set({ lang })
    localStorage.setItem("lang", lang)
  },
}))
