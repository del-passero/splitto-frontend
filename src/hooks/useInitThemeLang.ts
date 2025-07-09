// src/hooks/useInitThemeLang.ts
import { useEffect } from "react"
import { useSettingsStore, Lang } from "../store/settingsStore"

// Автонаследование темы и языка из Telegram при первом запуске
export function useInitThemeLang() {
  const { setTheme, setLang } = useSettingsStore()
  useEffect(() => {
    //@ts-ignore
    const tg = window?.Telegram?.WebApp
    // Telegram сам применяет переменные, но мы дублируем для состояния приложения
    const lang = tg?.initDataUnsafe?.user?.language_code
    if (lang && ["ru", "en", "es"].includes(lang)) setLang(lang as Lang)
  }, [setTheme, setLang])
}
