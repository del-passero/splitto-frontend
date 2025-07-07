// src/pages/ProfilePage.tsx

import { useThemeLang } from "../contexts/ThemeLangContext";
import { useUser } from "../contexts/UserContext";
import { useEffect, useState } from "react";
import { getAllUsers } from "../api/usersApi";
import type { User } from "../types/user";
import ProfileInfoCard from "../components/Profile/ProfileInfoCard";
import LogoutButton from "../components/Profile/LogoutButton";
import ProfileTabs from "../components/Profile/ProfileTabs";
import SettingsSection from "../components/Profile/SettingsSection";
import UsersList from "../components/Users/UsersList";

export default function ProfilePage() {
  const { user, loading, error, logout } = useUser();
  const { themeParams } = useThemeLang();

  const [tab, setTab] = useState<"profile" | "settings">("profile");
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
            <LogoutButton onClick={logout} />
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
