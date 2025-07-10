// src/locales/index.ts
import ru from "./ru"
import en from "./en"
import es from "./es"
import { Lang } from "../store/settingsStore"

const locales = { ru, en, es }

export const getLocale = (lang: Lang) => {
  if (lang === "auto") {
    const rawLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code
    const tgLang = typeof rawLang === "string" ? rawLang.slice(0, 2) : undefined
    if (tgLang && ["ru", "en", "es"].includes(tgLang)) return locales[tgLang as "ru" | "en" | "es"]
    return locales["ru"]
  }
  if (lang === "ru" || lang === "en" || lang === "es") return locales[lang]
  return locales["ru"] // fallback
}
