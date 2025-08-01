// src/pages/ProfilePage.tsx

import { useState } from "react"
import { Paintbrush, Languages, Info } from "lucide-react"
import CardSection from "../components/CardSection"
import UserCard from "../components/UserCard"
import SettingItem from "../components/SettingItem"
import { useUserStore } from "../store/userStore"
import { useSettingsStore } from "../store/settingsStore"
import { useApplyTheme } from "../hooks/useApplyTheme"
import { ModalSelector } from "../components/ModalSelector"
import { useTranslation } from "react-i18next"

const themeOptions = [
  { value: "auto", label: "theme_auto" },
  { value: "light", label: "theme_light" },
  { value: "dark", label: "theme_dark" },
]
const langOptions = [
  { value: "auto", label: "language_auto" },
  { value: "ru", label: "language_ru" },
  { value: "en", label: "language_en" },
  { value: "es", label: "language_es" },
]
const APP_VERSION = "0.1"

const ProfilePage = () => {
  useApplyTheme()
  const user = useUserStore((s) => s.user)
  const { theme, lang, setTheme, setLang } = useSettingsStore()
  const [themeOpen, setThemeOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { t, i18n } = useTranslation()

  return (
    <div className="min-h-screen w-full bg-[var(--tg-bg-color)] flex flex-col items-center py-10">
      <div className="w-full max-w-md flex flex-col space-y-2">
        <CardSection>
          <UserCard
            name={
              user?.first_name || user?.last_name
                ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
                : user?.username || t("not_specified")
            }
            username={user?.username || t("not_specified")}
            photo_url={user?.photo_url}
          />
        </CardSection>
        <CardSection>
          <SettingItem
            icon={<Paintbrush className="text-[var(--tg-link-color)]" size={22} />}
            label={t("theme")}
            value={t(`theme_${theme}`)}
            onClick={() => setThemeOpen(true)}
          />
          <SettingItem
            icon={<Languages className="text-[var(--tg-link-color)]" size={22} />}
            label={t("language")}
            value={t(`language_${lang}`)}
            onClick={() => setLangOpen(true)}
            isLast
          />
        </CardSection>
        <CardSection>
          <div className="flex items-center px-1 py-3">
            <Info className="text-[var(--tg-link-color)] mr-3" size={20} />
            <span className="flex-1 text-left text-[var(--tg-text-color)]">{t("version")}</span>
            <span className="text-[var(--tg-hint-color)]">{APP_VERSION}</span>
          </div>
        </CardSection>
        <ModalSelector
          title={t("choose_theme")}
          open={themeOpen}
          options={themeOptions.map((opt) => ({
            value: opt.value,
            label: t(opt.label),
          }))}
          value={theme}
          onChange={(v: string) => {
            setTheme(v as any)
            setThemeOpen(false)
          }}
          onClose={() => setThemeOpen(false)}
        />
        <ModalSelector
          title={t("choose_language")}
          open={langOpen}
          options={langOptions.map((opt) => ({
            value: opt.value,
            label: t(opt.label),
          }))}
          value={lang}
          onChange={(v: string) => {
            setLang(v as any)
            i18n.changeLanguage(v)
            setLangOpen(false)
          }}
          onClose={() => setLangOpen(false)}
        />
      </div>
    </div>
  )
}
export default ProfilePage
