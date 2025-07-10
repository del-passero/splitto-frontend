// src/locales/index.ts
import ru from "./ru"
import en from "./en"
import es from "./es"
import { Lang } from "../store/settingsStore"

const locales = { ru, en, es }

export const getLocale = (lang: Lang) => {
  if (lang === "ru" || lang === "en" || lang === "es") return locales[lang]
  return locales["ru"] // fallback, если auto
}
