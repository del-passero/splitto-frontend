// src/hooks/useSyncI18nLanguage.ts
import { useEffect } from "react"
import i18n from "i18next"
import { useSettingsStore } from "../store/settingsStore"

type Lang = "auto" | "ru" | "en" | "es"

const normalizeLang = (raw?: string | null): "ru" | "en" | "es" => {
  if (!raw) return "en"
  let c = raw.toLowerCase()
  if (c.includes("-")) c = c.split("-")[0]
  return (["ru", "en", "es"] as const).includes(c as any) ? (c as any) : "en"
}

export function useSyncI18nLanguage() {
  const lang = useSettingsStore(s => s.lang) as Lang

  useEffect(() => {
    let finalLang: "ru" | "en" | "es"
    if (lang === "auto") {
      // Берём язык текущего запуска из initDataUnsafe; если нет — en
      const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user
      finalLang = normalizeLang(tgUser?.language_code)
    } else {
      finalLang = lang
    }

    // Применяем язык
    i18n.changeLanguage(finalLang).catch(() => {})
    // Ставим атрибут lang на <html> — полезно для a11y/локали
    document.documentElement.setAttribute("lang", finalLang)
  }, [lang])
}
