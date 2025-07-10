import { useEffect } from "react"
import { useSettingsStore } from "../store/settingsStore"

function isDarkTheme(themeParams: any): boolean {
  // Твой bg_color тёмный => тема DARK!
  return themeParams?.bg_color === "#17212b" || themeParams?.bg_color === "#232e3c"
}

export function useApplyTheme() {
  const theme = useSettingsStore(s => s.theme)
  useEffect(() => {
    let finalTheme = theme
    if (theme === "auto") {
      const tgParams = window.Telegram?.WebApp?.themeParams
      finalTheme = isDarkTheme(tgParams) ? "dark" : "light"
    }
    document.body.classList.remove("light", "dark")
    document.body.classList.add(finalTheme)
  }, [theme])
}
