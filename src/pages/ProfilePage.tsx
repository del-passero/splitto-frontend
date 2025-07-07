// src/pages/ProfilePage.tsx

import { useThemeLang } from "../contexts/ThemeLangContext";
import { useUser } from "../contexts/UserContext";
import { useEffect, useState } from "react";
import { getAllUsers } from "../api/usersApi";
import type { User } from "../types/user";
import UsersList from "../components/UsersList";
import ProfileInfoCard from "../components/ProfileInfoCard";
import ProfileTabs from "../components/ProfileTabs";

// Тип для темы (исправлено: добавлен вариант "auto")
type ThemeType = "light" | "dark" | "auto";

// Настройки (SettingsSection)
function SettingsSection() {
  const { realTheme, setTheme, realLang, setLang } = useThemeLang();

  return (
    <div className="space-y-5">
      {/* Тема */}
      <div>
        <div className="font-semibold mb-2">Тема:</div>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme("auto")}
            className={`px-3 py-2 rounded-lg ${realTheme === "auto" ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]" : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"}`}
          >
            Наследовать
          </button>
          <button
            onClick={() => setTheme("light")}
            className={`px-3 py-2 rounded-lg ${realTheme === "light" ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]" : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"}`}
          >
            Светлая
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`px-3 py-2 rounded-lg ${realTheme === "dark" ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]" : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"}`}
          >
            Тёмная
          </button>
        </div>
      </div>
      {/* Язык */}
      <div>
        <div className="font-semibold mb-2">Язык:</div>
        <div className="flex gap-2">
          <button
            onClick={() => setLang("auto")}
            className={`px-3 py-2 rounded-lg ${realLang === "auto" ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]" : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"}`}
          >
            Наследовать
          </button>
          <button
            onClick={() => setLang("ru")}
            className={`px-3 py-2 rounded-lg ${realLang === "ru" ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]" : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"}`}
          >
            Русский
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-2 rounded-lg ${realLang === "en" ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]" : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"}`}
          >
            English
          </button>
          <button
            onClick={() => setLang("es")}
            className={`px-3 py-2 rounded-lg ${realLang === "es" ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]" : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"}`}
          >
            Español
          </button>
        </div>
      </div>
      {/* Заглушки: версия и ссылки */}
      <div className="mt-4 text-xs opacity-50 text-center">
        v0.1 • <a href="#" className="underline">Privacy Policy</a>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, error, logout } = useUser();
  const { themeParams } = useThemeLang();

  const [tab, setTab] = useState<"profile" | "settings">("profile");
  // Критично! ЯВНО типизируем users
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "profile") {
      setUsersLoading(true);
      getAllUsers()
        .then(setUsers)
        .catch((e) => setUsersError(e.message || "Ошибка загрузки пользователей"))
        .finally(() => setUsersLoading(false));
    }
  }, [tab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)]">
        <span className="text-lg font-semibold">Загрузка…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)]">
        <span className="text-red-600 text-lg">{error}</span>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)]">
        <span className="text-lg">Нет данных пользователя</span>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: themeParams?.bg_color || "#fff",
        color: themeParams?.text_color || "#222",
      }}
    >
      <div className="max-w-md mx-auto pt-8 px-4">
        <ProfileTabs tab={tab} setTab={setTab} />
        {tab === "profile" ? (
          <>
            <ProfileInfoCard user={user} />
            <button
              onClick={logout}
              className="w-full py-3 rounded-2xl text-white font-semibold text-lg"
              style={{
                background: "#ea5757", // danger style
                marginBottom: 18,
              }}
            >
              Выйти
            </button>
            <div className="mt-6">
              <div className="text-sm mb-1 font-bold opacity-60">Все пользователи:</div>
              {usersLoading && <div className="text-sm opacity-70">Загрузка списка…</div>}
              {usersError && <div className="text-red-600 text-sm">{usersError}</div>}
              <UsersList users={users} />
            </div>
            <div
              className="rounded-xl p-3 text-xs bg-[var(--tg-theme-secondary-bg-color)] mt-4"
              style={{
                color: themeParams?.text_color,
                background: themeParams?.secondary_bg_color,
              }}
            >
              <pre className="whitespace-pre-wrap">{JSON.stringify(user, null, 2)}</pre>
            </div>
          </>
        ) : (
          <SettingsSection />
        )}
      </div>
    </div>
  );
}
