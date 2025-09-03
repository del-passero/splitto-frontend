// src/hooks/useApplyTheme.ts
import { useEffect } from "react"
import { useSettingsStore } from "../store/settingsStore"

type Mode = "light" | "dark"

function hexToRgb(hex?: string): { r: number; g: number; b: number } | null {
  if (!hex || typeof hex !== "string") return null
  const m = hex.trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}
function isDarkByLuminance(hex?: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  const toLin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const L = 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b)
  return L < 0.5
}

export function useApplyTheme() {
  const theme = useSettingsStore(s => s.theme)

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp

    const detectMode = (): Mode => {
      // 1) Явная подсказка Telegram
      const scheme = tg?.colorScheme as Mode | undefined
      if (scheme === "light" || scheme === "dark") return scheme

      // 2) Эвристика по bg_color, если вдруг colorScheme нет
      const bg = tg?.themeParams?.bg_color
      if (bg) return isDarkByLuminance(bg) ? "dark" : "light"

      // 3) Вне Telegram — системная настройка
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
      return prefersDark ? "dark" as const : "light" as const
    }

    const apply = () => {
      const mode: Mode = theme === "auto" ? detectMode() : (theme as Mode)
      document.documentElement.setAttribute("data-theme", mode)
    }

    apply()

    // В auto реагируем на смену темы Telegram
    if (theme === "auto" && tg?.onEvent) {
      const handler = () => apply()
      tg.onEvent("themeChanged", handler)
      return () => { tg?.offEvent?.("themeChanged", handler) }
    }
  }, [theme])
}
