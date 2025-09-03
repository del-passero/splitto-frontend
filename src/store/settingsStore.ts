// src/store/settingsStore.ts
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type Theme = "auto" | "light" | "dark"
export type Lang = "auto" | "ru" | "en" | "es"

type SettingsStore = {
  theme: Theme
  lang: Lang
  setTheme: (theme: Theme) => void
  setLang: (lang: Lang) => void
  reset: () => void
}

const DEFAULTS: Pick<SettingsStore, "theme" | "lang"> = {
  theme: "auto",
  lang: "auto",
}

const isTheme = (v: any): v is Theme => v === "auto" || v === "light" || v === "dark"
const isLang = (v: any): v is Lang => v === "auto" || v === "ru" || v === "en" || v === "es"

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, _get) => ({
      ...DEFAULTS,
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persisted: any) => {
        const next = { ...DEFAULTS, ...(persisted ?? {}) }
        if (!isTheme(next.theme)) next.theme = DEFAULTS.theme
        if (!isLang(next.lang)) next.lang = DEFAULTS.lang
        return next
      },
    }
  )
)
