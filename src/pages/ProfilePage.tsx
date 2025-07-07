// src/pages/ProfilePage.tsx

import { useThemeLang } from "../contexts/ThemeLangContext";
import { useUser } from "../contexts/UserContext";

export default function ProfilePage() {
  const { user, loading, error, logout } = useUser();
  const { themeParams, realTheme, realLang } = useThemeLang();

  // Показываем загрузку или ошибку
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

  // Основной профиль
  return (
    <div
      className="min-h-screen"
      style={{
        background: themeParams?.bg_color || "#fff",
        color: themeParams?.text_color || "#222",
      }}
    >
      <div className="max-w-md mx-auto pt-8 px-4">
        {/* Карточка пользователя */}
        <div
          className="flex items-center rounded-2xl shadow p-4 mb-6"
          style={{
            background: themeParams?.secondary_bg_color || "#f4f4f5",
          }}
        >
          {/* Аватар или инициалы */}
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt="avatar"
              className="rounded-full w-16 h-16 object-cover border"
            />
          ) : (
            <div
              className="rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl"
              style={{
                background: themeParams?.hint_color || "#e0e0e0",
                color: themeParams?.text_color || "#222",
              }}
            >
              {user.first_name?.charAt(0)}
              {user.last_name?.charAt(0)}
            </div>
          )}
          {/* Инфо о пользователе */}
          <div className="flex-1 ml-4">
            <div className="text-xl font-semibold">{user.name}</div>
            <div className="opacity-70 text-sm">@{user.username}</div>
            <div className="flex items-center mt-2">
              {/* Бейдж Премиум (заглушка) */}
              <span className="ml-auto px-3 py-0.5 rounded-lg text-xs font-bold"
                style={{
                  background: themeParams?.button_color || "#e3e6f1",
                  color: themeParams?.button_text_color || "#377df7",
                }}>
                Обычный
              </span>
            </div>
          </div>
        </div>
        {/* Кнопка Выйти */}
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
        {/* Демо: вся информация о пользователе */}
        <div
          className="rounded-xl p-3 text-xs bg-[var(--tg-theme-secondary-bg-color)] mt-4"
          style={{
            color: themeParams?.text_color,
            background: themeParams?.secondary_bg_color,
          }}
        >
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
