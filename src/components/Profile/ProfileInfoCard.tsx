// src/components/Profile/ProfileInfoCard.tsx
import type { User } from "../../types/user";
import Avatar from "../Common/Avatar";
import Badge from "../Common/Badge";

export default function ProfileInfoCard({ user }: { user: User }) {
  return (
    <div className="flex items-center rounded-2xl shadow p-4 mb-6 bg-[var(--tg-theme-secondary-bg-color)]">
      <Avatar user={user} size={64} />
      <div className="flex-1 ml-4">
        <div className="text-xl font-semibold truncate">{user.name}</div>
        <div className="opacity-70 text-sm truncate">@{user.username}</div>
        <div className="flex items-center mt-2">
          <Badge text="Обычный" />
        </div>
      </div>
    </div>
  );
}
