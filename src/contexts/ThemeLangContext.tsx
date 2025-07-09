// src/contexts/ThemeLangContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useTelegramThemeParams } from "../hooks/useTelegramTheme"
import { getTelegramUser } from "../hooks/useTelegramUser"

export const SUPPORTED_LANGS = ["ru", "en", "es"] as const
export type SupportedLangs = typeof SUPPORTED_LANGS[number]
export type ThemeType = "light" | "dark"

interface ThemeLangContextValue {
  theme: ThemeType
  setTheme: (t: ThemeType) => void
  realTheme: ThemeType
  themeParams: any
  lang: SupportedLangs
  setLang: (l: SupportedLangs) => void
  realLang: SupportedLangs
}

const ThemeLangContext = createContext<ThemeLangContextValue | undefined>(undefined)

export function useThemeLang() {
  const ctx = useContext(ThemeLangContext)
  if (!ctx) throw new Error("useThemeLang must be used inside ThemeLangProvider")
  return ctx
}

export function ThemeLangProvider({ children }: { children: ReactNode }) {
  // Сохраняем только light/dark/lang (auto — убираем, Telegram всегда один из поддерживаемых)
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem("theme_type")
    if (saved === "light" || saved === "dark") return saved
    return "light"
  })
  const [lang, setLang] = useState<SupportedLangs>(() => {
    const saved = localStorage.getItem("lang_code")
    if (SUPPORTED_LANGS.includes(saved as SupportedLangs)) return saved as SupportedLangs
    return "en"
  })

  const themeParams = useTelegramThemeParams()
  const tgUser = getTelegramUser()

  useEffect(() => {
    localStorage.setItem("theme_type", theme)
  }, [theme])
  useEffect(() => {
    localStorage.setItem("lang_code", lang)
  }, [lang])

  // Язык Telegram
  let tgLang: SupportedLangs = "en"
  if (tgUser?.language_code && SUPPORTED_LANGS.includes(tgUser.language_code as SupportedLangs)) {
    tgLang = tgUser.language_code as SupportedLangs
  }

  // Тема Telegram
  const realTheme: ThemeType =
    theme === "light" || theme === "dark"
      ? theme
      : (themeParams?.bg_color?.toLowerCase() === "#ffffff" ? "light" : "dark")

  const realLang: SupportedLangs = lang || tgLang

  return (
    <ThemeLangContext.Provider
      value={{
        theme,
        setTheme,
        realTheme,
        themeParams,
        lang,
        setLang,
        realLang
      }}
    >
      {children}
    </ThemeLangContext.Provider>
  )
}
