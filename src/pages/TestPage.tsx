// src/pages/ProfilePage.tsx
import { useState } from "react"
import { Paintbrush, Languages, Info } from "lucide-react"
import { useUserStore } from "../store/userStore"
import { useSettingsStore } from "../store/settingsStore"
import { getLocale } from "../locales"
import UserCard from "../components/UserCard"
import SettingItem from "../components/SettingItem"
import CardSection from "../components/CardSection"
import { ModalSelector } from "../components/ModalSelector"
import { useSyncTelegramThemeLang } from "../hooks/useSyncTelegramThemeLang"
import { useTelegramAuth } from "../hooks/useTelegramAuth"

const themeOptions = [
  { value: "auto", label: "Из Telegram" },
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
]
const langOptions = [
  { value: "auto", label: "Из Telegram" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
]

const APP_VERSION = "0.1"

const ProfilePage = () => {
  useSyncTelegramThemeLang()
  useTelegramAuth()
  const user = useUserStore(s => s.user)
  const { theme, lang, setTheme, setLang } = useSettingsStore()
  const t = getLocale(lang)
  const [themeOpen, setThemeOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  return (
    <div className="min-h-screen w-full bg-[var(--tg-bg-color)] flex flex-col items-center py-10">
      <div className="w-full max-w-[420px] mx-auto px-2">

        {/* Секция 1: Аккаунт */}
        <CardSection title={t.account} className="my-[80px]">
          <UserCard
            name={
              user?.first_name || user?.last_name
                ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
                : user?.username || t.not_specified
            }
            username={user?.username || t.not_specified}
            photo_url={user?.photo_url}
          />
        </CardSection>

        {/* Секция 2: Настройки */}
        <CardSection title={t.settings} className="my-[80px]">
          <SettingItem
            icon={<Paintbrush className="text-[var(--tg-link-color)]" size={22} />}
            label={t.theme}
            value={t[`theme_${theme}` as keyof typeof t] || ""}
            onClick={() => setThemeOpen(true)}
          />
          <SettingItem
            icon={<Languages className="text-[var(--tg-link-color)]" size={22} />}
            label={t.language}
            value={t[`language_${lang}` as keyof typeof t] || ""}
            onClick={() => setLangOpen(true)}
            isLast
          />
        </CardSection>

        {/* Секция 3: О приложении */}
        <CardSection title={t.about} className="my-[80px]">
          <div className="flex items-center px-1 py-3">
            <Info className="text-[var(--tg-link-color)] mr-3" size={20} />
            <span className="flex-1 text-left text-[var(--tg-text-color)]">{t.version}</span>
            <span className="text-[var(--tg-hint-color)]">{APP_VERSION}</span>
          </div>
        </CardSection>

        {/* Модальные окна */}
        <ModalSelector
          title={t.choose_theme}
          open={themeOpen}
          options={themeOptions.map(opt => ({ ...opt, label: t[`theme_${opt.value}` as keyof typeof t] }))}
          value={theme}
          onChange={v => { setTheme(v as any); setThemeOpen(false) }}
          onClose={() => setThemeOpen(false)}
        />
        <ModalSelector
          title={t.choose_language}
          open={langOpen}
          options={langOptions.map(opt => ({ ...opt, label: t[`language_${opt.value}` as keyof typeof t] }))}
          value={lang}
          onChange={v => { setLang(v as any); setLangOpen(false) }}
          onClose={() => setLangOpen(false)}
        />
      </div>
    </div>
  )
}
export default ProfilePage
