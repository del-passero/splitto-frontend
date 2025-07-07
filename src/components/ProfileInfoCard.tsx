// src/components/ProfileInfoCard.tsx

import type { User } from "../types/user";
import { useThemeLang } from "../contexts/ThemeLangContext";

interface ProfileInfoCardProps {
  user: User;
}

export default function ProfileInfoCard({ user }: ProfileInfoCardProps) {
  const { themeParams } = useThemeLang();

  return (
    <div
      className="flex items-center rounded-2xl shadow p-4 mb-6"
      style={{
        background: themeParams?.secondary_bg_color || "#f4f4f5",
      }}
    >
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
      <div className="flex-1 ml-4">
        <div className="text-xl font-semibold">{user.name}</div>
        <div className="opacity-70 text-sm">@{user.username}</div>
        <div className="flex items-center mt-2">
          <span
            className="ml-auto px-3 py-0.5 rounded-lg text-xs font-bold"
            style={{
              background: themeParams?.button_color || "#e3e6f1",
              color: themeParams?.button_text_color || "#377df7",
            }}
          >
            Обычный
          </span>
        </div>
      </div>
    </div>
  );
}
