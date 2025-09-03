// src/locales/index.ts
import ru from "./ru"
import en from "./en"
import es from "./es"

export const LOCALES = { ru, en, es } as const
export const SUPPORTED_LANGS = ["ru", "en", "es"] as const
export type SupportedLang = typeof SUPPORTED_LANGS[number]

export function resolveLanguage(input?: string): SupportedLang {
  const base = (input || "").toLowerCase().split("-")[0]
  return (SUPPORTED_LANGS as readonly string[]).includes(base as any)
    ? (base as SupportedLang)
    : "en"
}

export function getLocale(lang: string | undefined) {
  return LOCALES[resolveLanguage(lang)]
}

export { ru, en, es }
