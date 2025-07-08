// src/components/profile/ProfileCard.tsx

import Avatar from "../common/Avatar";
import Badge from "../common/Badge";
import AppButton from "../common/AppButton";
import { t } from "../../locales/locale";
import type { User } from "../../types/user";

interface ProfileCardProps {
  user: User;
  lang: "ru" | "en" | "es";
  onEdit?: () => void;
}

export default function ProfileCard({ user, lang, onEdit }: ProfileCardProps) {
  return (
    <div className="flex items-center p-4 rounded-2xl shadow bg-[var(--tg-theme-secondary-bg-color)] mb-4">
      <Avatar
        photoUrl={user.photo_url || undefined}
        firstName={user.first_name || undefined}
        lastName={user.last_name || undefined}
        size={64}
        className="mr-4"
      />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-lg truncate">{user.name}</div>
        <div className="text-xs opacity-70 truncate mb-1">@{user.username}</div>
        {user.phone && (
          <div className="text-xs opacity-70 truncate">{user.phone}</div>
        )}
        <div className="flex items-center gap-2 mt-1">
          {user.is_pro && <Badge color="gold">PRO</Badge>}
        </div>
      </div>
      {onEdit && (
        <AppButton color="secondary" className="w-auto px-4 py-2 ml-3" onClick={onEdit}>
          {t("profile.edit", lang)}
        </AppButton>
      )}
    </div>
  );
}
