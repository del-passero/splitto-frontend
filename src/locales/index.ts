// src/locales/index.ts
import ru from "./ru"
import en from "./en"
import es from "./es"

export type Locale = typeof ru

const locales: Record<string, Locale> = { ru, en, es }

export function getLocale(lang: string): Locale {
  if (lang.startsWith("ru")) return locales.ru
  if (lang.startsWith("es")) return locales.es
  return locales.en
}
