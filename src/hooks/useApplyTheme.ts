// src/hooks/useApplyTheme.ts
import { useEffect } from "react"
import { useSettingsStore } from "../store/settingsStore"

type Mode = "light" | "dark"
type Theme = "auto" | Mode

// Перечень всех var(--tg-*) которые могли быть записаны инлайном старым кодом.
// Мы их удалим, чтобы пресеты из CSS (html[data-theme]) снова управляли UI.
const VAR_KEYS = [
  "--tg-bg-color",
  "--tg-card-bg",
  "--tg-text-color",
  "--tg-hint-color",
  "--tg-link-color",
  "--tg-accent-color",
  "--tg-secondary-bg-color",
  "--tg-button-color",
  "--tg-button-text-color",
  "--tg-accent-bg-color",
  "--tg-fab-label-bg",
  "--tg-fab-label-color",
]

// Удаляем любые инлайновые overrides CSS-переменных на <html>,
// чтобы css-правила html[data-theme="..."] снова стали источником истины.
function clearInlineOverrides() {
  const root = document.documentElement
  for (const k of VAR_KEYS) root.style.removeProperty(k)
}

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
  const theme = useSettingsStore(s => s.theme) as Theme

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp

    const detectModeFromTelegram = (): Mode => {
      const scheme = tg?.colorScheme as Mode | undefined
      if (scheme === "light" || scheme === "dark") return scheme
      const bg = tg?.themeParams?.bg_color
      if (bg) return isDarkByLuminance(bg) ? "dark" : "light"
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
      return prefersDark ? "dark" : "light"
    }

    const setMode = (mode: Mode) => {
      // Ключевой порядок:
      // 1) убираем старые инлайновые overrides (если вдруг были)
      // 2) выставляем атрибут темы
      clearInlineOverrides()
      document.documentElement.setAttribute("data-theme", mode)
    }

    const apply = () => {
      if (theme === "auto") {
        setMode(detectModeFromTelegram())
      } else {
        // РУЧНОЙ ВЫБОР ВСЕГДА СИЛЬНЕЕ Telegram
        setMode(theme)
      }
    }

    apply()

    // Слушаем Telegram только в auto
    if (theme === "auto" && tg?.onEvent) {
      const handler = () => apply()
      tg.onEvent("themeChanged", handler)
      return () => { try { tg.offEvent?.("themeChanged", handler) } catch {} }
    }
  }, [theme])
}
