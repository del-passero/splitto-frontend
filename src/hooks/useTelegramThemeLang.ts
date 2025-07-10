// src/hooks/useTelegramThemeLang.ts
import { useEffect, useState } from "react"

export function useTelegramThemeLang() {
  const [ready, setReady] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [tgLang, setTgLang] = useState<"ru" | "en" | "es">("ru")

  useEffect(() => {
    const tg = window.Telegram?.WebApp

    function detectTheme() {
      // tg может быть undefined, поэтому делаем проверку:
      const params = tg?.themeParams
      const bg = params?.bg_color
      setIsDark(bg === "#17212b" || bg === "#232e3c" || bg === "#18191b")
    }

    function detectLang() {
      const code = tg?.initDataUnsafe?.user?.language_code
      const short = code ? code.slice(0, 2) : "ru"
      if (["ru", "en", "es"].includes(short)) setTgLang(short as any)
    }

    detectTheme()
    detectLang()
    setReady(true)

    // Только если tg определён!
    tg?.onEvent?.("themeChanged", detectTheme)

    return () => {
      tg?.offEvent?.("themeChanged", detectTheme)
    }
  }, [])

  return { ready, isDark, tgLang }
}
