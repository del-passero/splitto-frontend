// src/components/UserCard.tsx

import type { User } from "../types/user";
import { useThemeLang } from "../contexts/ThemeLangContext";

interface UserCardProps {
  user: User;
  right?: React.ReactNode; // для бейджа, номера, кнопки и т.д.
  onClick?: () => void;
  className?: string;
}

export default function UserCard({ user, right, onClick, className = "" }: UserCardProps) {
  const { themeParams } = useThemeLang();

  return (
    <div
      onClick={onClick}
      className={`flex items-center rounded-xl p-3 shadow bg-[var(--tg-theme-secondary-bg-color)] cursor-pointer transition hover:shadow-md ${className}`}
      style={{
        background: themeParams?.secondary_bg_color || "#f4f4f5",
        color: themeParams?.text_color || "#222",
      }}
    >
      {user.photo_url ? (
        <img src={user.photo_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-gray-300 text-gray-800">
          {user.first_name?.[0] || "?"}
          {user.last_name?.[0] || ""}
        </div>
      )}
      <div className="ml-3 flex-1 min-w-0">
        <div className="font-medium truncate">{user.name}</div>
        <div className="text-xs opacity-70 truncate">@{user.username}</div>
      </div>
      {right && <div className="ml-2">{right}</div>}
    </div>
  );
}
