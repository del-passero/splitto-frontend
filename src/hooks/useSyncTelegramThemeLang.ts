// src/hooks/useSyncTelegramThemeLang.ts
import { useEffect } from "react"
import { useSettingsStore } from "../store/settingsStore"

// Автонастройка темы и языка по Telegram WebApp (только если выбран "auto")
export function useSyncTelegramThemeLang() {
  const { theme, setTheme, lang, setLang } = useSettingsStore()
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    // Тема
    if (theme === "auto" && tg?.themeParams) {
      // Логика определения тёмной/светлой
      const isDark = tg.themeParams.bg_color === "#18191b" || tg.themeParams.bg_color === "#232b3b"
      setTheme(isDark ? "dark" : "light")
    }
    // Язык
    if (lang === "auto" && tg?.initDataUnsafe?.user?.language_code) {
      const langCode = tg.initDataUnsafe.user.language_code.slice(0, 2)
      if (["ru", "en", "es"].includes(langCode)) setLang(langCode as any)
    }
  }, [theme, lang, setTheme, setLang])
}
