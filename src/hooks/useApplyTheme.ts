// src/hooks/useApplyTheme.ts
import { useEffect } from "react"
import { useSettingsStore } from "../store/settingsStore"

type ThemeName = "auto" | "light" | "dark"

// Набор основных переменных, которые используются в UI.
// Важно: если где-то появятся новые var(--tg-...),
// просто добавь их сюда в пресеты.
const LIGHT_PRESET: Record<string, string> = {
  "--tg-bg-color": "#ffffff",
  "--tg-text-color": "#0a0a0a",
  "--tg-hint-color": "#6b7280",            // gray-500
  "--tg-link-color": "#2481cc",            // телеграмный синий близкий
  "--tg-button-color": "#2481cc",
  "--tg-button-text-color": "#ffffff",
  "--tg-secondary-bg-color": "#f2f3f5",
  "--tg-accent-bg-color": "rgba(36,129,204,0.08)",
}

const DARK_PRESET: Record<string, string> = {
  "--tg-bg-color": "#17212b",              // популярный bg из Telegram dark
  "--tg-text-color": "#e6e6e6",
  "--tg-hint-color": "#8b949e",
  "--tg-link-color": "#6ab3f3",
  "--tg-button-color": "#2ea6ff",
  "--tg-button-text-color": "#0b0f13",     // можно и #fff, если контраст нужен выше
  "--tg-secondary-bg-color": "#232e3c",
  "--tg-accent-bg-color": "rgba(255,255,255,0.06)",
}

function setRootVars(vars: Record<string, string>) {
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v)
  }
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
  // относительная яркость по WCAG
  const toLin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const L = 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b)
  return L < 0.5
}

function applyPreset(name: "light" | "dark") {
  const vars = name === "dark" ? DARK_PRESET : LIGHT_PRESET
  setRootVars(vars)
  setHtmlThemeClass(name)
}

function setHtmlThemeClass(mode: "light" | "dark") {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(mode)
  root.setAttribute("data-theme", mode)
}

function applyTelegramTheme(tgThemeParams: any) {
  // На базе Telegram themeParams проставляем все известные переменные,
  // а где нет — подставляем из пресета по яркости bg_color.
  const dark = isDarkByLuminance(tgThemeParams?.bg_color)

  const base = dark ? DARK_PRESET : LIGHT_PRESET

  const merged: Record<string, string> = {
    "--tg-bg-color": tgThemeParams?.bg_color || base["--tg-bg-color"],
    "--tg-text-color": tgThemeParams?.text_color || base["--tg-text-color"],
    "--tg-hint-color": tgThemeParams?.hint_color || base["--tg-hint-color"],
    "--tg-link-color": tgThemeParams?.link_color || base["--tg-link-color"],
    "--tg-button-color": tgThemeParams?.button_color || base["--tg-button-color"],
    "--tg-button-text-color": tgThemeParams?.button_text_color || base["--tg-button-text-color"],
    // Доп. параметры у Telegram не всегда есть — держим свои:
    "--tg-secondary-bg-color": base["--tg-secondary-bg-color"],
    "--tg-accent-bg-color": base["--tg-accent-bg-color"],
  }

  setRootVars(merged)
  setHtmlThemeClass(dark ? "dark" : "light")
}

export function useApplyTheme() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp

    // Основное применение темы
    const apply = (mode: ThemeName) => {
      if (mode === "auto") {
        if (tg?.themeParams) {
          applyTelegramTheme(tg.themeParams)
        } else {
          // Нет Telegram (или нет themeParams): fallback по prefers-color-scheme
          const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
          applyPreset(prefersDark ? "dark" : "light")
        }
      } else {
        applyPreset(mode)
      }
    }

    // Применяем текущую
    apply(theme)

    // В auto — слушаем смену темы Telegram
    let cleanup: (() => void) | undefined
    if (theme === "auto" && tg?.onEvent) {
      const handler = () => apply("auto")
      tg.onEvent("themeChanged", handler)
      cleanup = () => tg.offEvent && tg.offEvent("themeChanged", handler)
    }

    return () => {
      if (cleanup) cleanup()
    }
  }, [theme])
}
