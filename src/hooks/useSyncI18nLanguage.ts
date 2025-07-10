// src/hooks/useSyncI18nLanguage.ts
import { useEffect } from "react"
import { useSettingsStore } from "../store/settingsStore"
import { useTelegramThemeLang } from "./useTelegramThemeLang"
import i18n from "i18next"

export function useSyncI18nLanguage() {
  const { lang } = useSettingsStore()
  const { tgLang } = useTelegramThemeLang()
  useEffect(() => {
    i18n.changeLanguage(lang === "auto" ? tgLang : lang)
  }, [lang, tgLang])
}
