// src/contexts/ThemeLangContext.tsx
import { createContext, useContext, useState, useEffect } from "react"
import { getTelegramUser } from "../hooks/useTelegramUser"

export type ThemeType = "light" | "dark"
export type LangCode = "ru" | "en" | "es"

interface ThemeLangContextProps {
  theme: ThemeType
  setTheme: (t: ThemeType) => void
  lang: LangCode
  setLang: (l: LangCode) => void
}

const ThemeLangContext = createContext<ThemeLangContextProps | undefined>(undefined)

export function ThemeLangProvider({ children }: { children: React.ReactNode }) {
  // Наследование из Telegram (fallback — светлая/англ)
  const tgUser = getTelegramUser()
  const [theme, setTheme] = useState<ThemeType>("light")
  const [lang, setLang] = useState<LangCode>(
    (tgUser?.language_code === "ru" || tgUser?.language_code === "es") ? tgUser.language_code : "en"
  )

  useEffect(() => {
    document.body.dataset.theme = theme
  }, [theme])

  return (
    <ThemeLangContext.Provider value={{ theme, setTheme, lang, setLang }}>
      {children}
    </ThemeLangContext.Provider>
  )
}

export function useThemeLang() {
  const ctx = useContext(ThemeLangContext)
  if (!ctx) throw new Error("useThemeLang must be used inside ThemeLangProvider")
  return ctx
}
