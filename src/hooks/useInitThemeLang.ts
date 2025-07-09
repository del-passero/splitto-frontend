// src/hooks/useInitThemeLang.ts
import { useEffect } from "react"
import { useSettingsStore, Lang } from "../store/settingsStore"

export function useInitThemeLang() {
  const { setTheme, setLang } = useSettingsStore()
  useEffect(() => {
    //@ts-ignore
    const tg = window?.Telegram?.WebApp
    const lang = tg?.initDataUnsafe?.user?.language_code
    if (lang && ["ru", "en", "es"].includes(lang)) setLang(lang as Lang)
  }, [setTheme, setLang])
}
