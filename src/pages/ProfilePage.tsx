// src/pages/ProfilePage.tsx
import { useState } from "react"
import { Paintbrush, Languages } from "lucide-react"
import { useUserStore } from "../store/userStore"
import { useSettingsStore } from "../store/settingsStore"
import { getLocale } from "../locales"
import UserCard from "../components/UserCard"
import SettingItem from "../components/SettingItem"
import { ModalSelector } from "../components/ModalSelector"

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

const ProfilePage = () => {
  const user = useUserStore(s => s.user)
  const { theme, lang, setTheme, setLang } = useSettingsStore()
  const t = getLocale(lang) as Record<string, string>
  const [themeOpen, setThemeOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  return (
    <div className="max-w-md mx-auto pt-4 pb-20 min-h-screen bg-[var(--tg-bg-color)]">
      <UserCard
        name={`${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "User"}
        username={user?.username || undefined}
        photo_url={user?.photo_url || undefined}
      />
      <div className="mb-4 px-2">
        <div className="font-semibold text-[var(--tg-hint-color)] mb-2">{t.settings}</div>
        <SettingItem
          icon={<Paintbrush className="text-[var(--tg-link-color)]" size={22} />}
          label={t.theme}
          value={t[`theme_${theme}`]}
          onClick={() => setThemeOpen(true)}
        />
        <SettingItem
          icon={<Languages className="text-[var(--tg-link-color)]" size={22} />}
          label={t.language}
          value={t[`language_${lang}`]}
          onClick={() => setLangOpen(true)}
        />
      </div>
      <div className="px-2">
        <div className="font-semibold text-[var(--tg-hint-color)] mb-2">{t.about}</div>
        <div className="w-full flex items-center rounded-xl py-3 px-4 bg-[var(--tg-bg-color)] shadow">
          <span className="flex-1 text-left text-[var(--tg-text-color)]">{t.app_version}</span>
          <span className="text-[var(--tg-hint-color)]">1.0.0</span>
        </div>
      </div>
      <ModalSelector
        title={t.theme}
        open={themeOpen}
        options={themeOptions.map(opt => ({ ...opt, label: t[`theme_${opt.value}`] }))}
        value={theme}
        onChange={v => { setTheme(v as any); setThemeOpen(false) }}
        onClose={() => setThemeOpen(false)}
      />
      <ModalSelector
        title={t.language}
        open={langOpen}
        options={langOptions.map(opt => ({ ...opt, label: t[`language_${opt.value}`] }))}
        value={lang}
        onChange={v => { setLang(v as any); setLangOpen(false) }}
        onClose={() => setLangOpen(false)}
      />
    </div>
  )
}
export default ProfilePage
