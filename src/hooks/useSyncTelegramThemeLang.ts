// src/hooks/useSyncTelegramThemeLang.ts
import { useEffect } from "react"
import { useSettingsStore, Lang } from "../store/settingsStore"

export function useSyncTelegramThemeLang() {
  const { theme, lang, setLang } = useSettingsStore()
  useEffect(() => {
    //@ts-ignore
    const tg = window?.Telegram?.WebApp
    if (theme === "auto") {
      document.body.classList.remove("light", "dark")
    } else {
      document.body.classList.remove("light", "dark")
      document.body.classList.add(theme)
    }
    const langCode = tg?.initDataUnsafe?.user?.language_code ?? ""
    if (lang === "auto" && ["ru", "en", "es"].includes(langCode)) {
      setLang(langCode as Lang)
    }
  }, [theme, lang, setLang])
}
