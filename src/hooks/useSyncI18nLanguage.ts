// src/hooks/useSyncI18nLanguage.ts
import { useEffect } from "react"
import { useSettingsStore } from "../store/settingsStore"
import { useTranslation } from "react-i18next"

const SUPPORTED_LANGS = ["ru", "en", "es"] as const
type Supported = typeof SUPPORTED_LANGS[number]

function getTelegramLang(): string {
  try {
    const tg = (window as any)?.Telegram?.WebApp
    // Предпочтительно берем user.language_code, иначе общий language_code
    return tg?.initDataUnsafe?.user?.language_code || tg?.initDataUnsafe?.language_code || ""
  } catch {
    return ""
  }
}

function normalizeToSupported(lang: string | undefined): Supported | "en" {
  const base = (lang || "").toLowerCase().split("-")[0]
  return (SUPPORTED_LANGS as readonly string[]).includes(base) ? (base as Supported) : "en"
}

export function useSyncI18nLanguage() {
  const lang = useSettingsStore((s) => s.lang)
  const { i18n } = useTranslation()

  useEffect(() => {
    const finalLang: Supported | "en" =
      lang === "auto" ? normalizeToSupported(getTelegramLang()) : normalizeToSupported(lang)

    // Избегаем лишнего переключения языка
    const current = normalizeToSupported(i18n.language)
    if (current !== finalLang) {
      i18n.changeLanguage(finalLang)
    }

    // Для доступности и корректной типографики
    document.documentElement.setAttribute("lang", finalLang)
  }, [lang, i18n])
}
