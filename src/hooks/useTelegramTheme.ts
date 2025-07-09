// src/hooks/useTelegramTheme.ts

import { useEffect, useState } from "react"

/**
 * Хук для подписки на тему Telegram WebApp.
 * Следит за изменениями темы (например, когда пользователь меняет тему в Telegram).
 */
export function useTelegramThemeParams() {
  const [themeParams, setThemeParams] = useState<any>(
    window.Telegram?.WebApp?.themeParams || {}
  )

  useEffect(() => {
    const updateTheme = () => {
      setThemeParams(window.Telegram?.WebApp?.themeParams || {})
    }
    window.Telegram?.WebApp?.onEvent?.("themeChanged", updateTheme)
    return () => {
      window.Telegram?.WebApp?.offEvent?.("themeChanged", updateTheme)
    }
  }, [])

  return themeParams
}
