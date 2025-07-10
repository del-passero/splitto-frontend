import ru from "./ru"
import en from "./en"
import es from "./es"
import { Lang } from "../store/settingsStore"

const locales = { ru, en, es }

export const getLocale = (lang: Lang) => {
  if (lang === "auto") {
    const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code
    if (tgLang && ["ru", "en", "es"].includes(tgLang.slice(0, 2))) {
      return locales[tgLang.slice(0, 2) as "ru" | "en" | "es"]
    }
    return locales["ru"]
  }
  if (lang === "ru" || lang === "en" || lang === "es") return locales[lang]
  return locales["ru"]
}
