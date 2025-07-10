// src/hooks/useApplyTheme.ts
import { useEffect } from "react"
import { useSettingsStore } from "../store/settingsStore"

function isDarkTelegramTheme(themeParams: any): boolean {
  if (!themeParams) return false
  // Можно сравнить по bg_color, accent_text_color или другому признаку
  return (
    themeParams.bg_color === "#18191b" ||
    themeParams.bg_color === "#232b3b" ||
    themeParams.bg_color === "#19191a"
  )
}

export function useApplyTheme() {
  const theme = useSettingsStore(s => s.theme)
  useEffect(() => {
    let finalTheme = theme
    if (theme === "auto") {
      const tgParams = window.Telegram?.WebApp?.themeParams
      finalTheme = isDarkTelegramTheme(tgParams) ? "dark" : "light"
    }
    document.body.classList.remove("light", "dark")
    document.body.classList.add(finalTheme)
  }, [theme])
}
