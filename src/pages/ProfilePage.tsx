import { useState } from "react"
import { Paintbrush, Languages } from "lucide-react"
import { useUserStore } from "../store/userStore"
import { useSettingsStore } from "../store/settingsStore"
import { getLocale } from "../locales"
import UserCard from "../components/UserCard"
import SettingItem from "../components/SettingItem"
import CardSection from "../components/CardSection"
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
    <div className="w-full min-h-screen bg-[var(--tg-bg-color)] flex flex-col items-center">
      <div className="w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg mt-4">
        <UserCard
          name={`${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "User"}
          username={user?.username || undefined}
          photo_url={user?.photo_url || undefined}
        />

        {/* ПРОВЕРКА TAILWIND — ВСТАВЬ СЮДА! */}
        <div className="bg-red-400 text-white text-xl p-4 mb-4 text-center rounded-2xl shadow">
        <div className="test-red">Test css import</div>

          Проверка Tailwind
        </div>

        <CardSection className="mt-0">
          <div className="font-semibold text-[var(--tg-hint-color)] mb-2 tracking-wide">НАСТРОЙКИ</div>
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
            last
          />
        </CardSection>
        <CardSection>
          <div className="font-semibold text-[var(--tg-hint-color)] mb-2 tracking-wide">О ПРИЛОЖЕНИИ</div>
          <div className="w-full flex items-center py-3 px-1">
            <span className="flex-1 text-left text-[var(--tg-text-color)]">{t.app_version}</span>
            <span className="text-[var(--tg-hint-color)]">1.0.0</span>
          </div>
        </CardSection>
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
