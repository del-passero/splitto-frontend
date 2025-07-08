// src/components/info/InfoBlock.tsx

import { t } from "../../locales/locale"
import { useThemeLang } from "../../contexts/ThemeLangContext"

export default function InfoBlock() {
  const { lang } = useThemeLang()
  return (
    <div className="rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] p-4 mt-2 shadow">
      <div className="font-bold mb-2">{t("info.title", lang)}</div>
      <ul className="text-sm opacity-80 space-y-1">
        <li>{t("info.faq", lang)}</li>
        <li>{t("info.privacy", lang)}</li>
        <li>{t("info.support", lang)}</li>
      </ul>
    </div>
  )
}
