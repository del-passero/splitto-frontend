// src/pages/ProfilePage.tsx

import { useUser } from "../contexts/UserContext"
import { useThemeLang } from "../contexts/ThemeLangContext"
import ProfileCard from "../components/profile/ProfileCard"
import ProDonateBlock from "../components/monetization/ProDonateBlock"
import SettingsBlock from "../components/settings/SettingsBlock"
import SecurityBlock from "../components/security/SecurityBlock"
import InfoBlock from "../components/info/InfoBlock"
import Divider from "../components/common/Divider"
import { t } from "../locales/locale"

/**
 * Главная страница профиля Splitto — с поддержкой темы и локализации Telegram
 */
export default function ProfilePage() {
  const { user, loading, error, logout } = useUser()
  const { lang } = useThemeLang()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)]">
        <span className="text-lg font-semibold">{t("profile.loading", lang)}</span>
      </div>
    )
  }
  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)]">
        <span className="text-red-600 text-lg">{error || t("profile.no_user", lang)}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-2 pb-6 bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)]">
      {/* Карточка пользователя */}
      <ProfileCard user={user} lang={lang} onEdit={() => alert("Скоро редактирование профиля!")} />
      <Divider />
      {/* Блок PRO и доната */}
      <ProDonateBlock />
      <Divider />
      {/* Настройки */}
      <SettingsBlock />
      <Divider />
      {/* Безопасность */}
      <SecurityBlock />
      <Divider />
      {/* Информация, версия, поддержка */}
      <InfoBlock />
      <div className="text-xs opacity-60 text-center mt-8">
        Splitto &copy; 2025 — v1.0.0
      </div>
      {/* Кнопка Выйти */}
      <button
        onClick={logout}
        className="w-full mt-4 py-3 rounded-2xl text-white font-semibold text-lg"
        style={{
          background: "#ea5757",
        }}
      >
        {t("profile.logout", lang)}
      </button>
    </div>
  )
}
