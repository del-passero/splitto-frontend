// src/components/users/UserCard.tsx

import Avatar from "../common/Avatar";
import Badge from "../common/Badge";
import type { User } from "../../types/user";

export default function UserCard({ user, right }: { user: User; right?: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3 shadow bg-[var(--tg-theme-secondary-bg-color)] cursor-pointer transition hover:shadow-md"
    >
      <Avatar
        photoUrl={user.photo_url || undefined}
        firstName={user.first_name || undefined}
        lastName={user.last_name || undefined}
        size={40}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{user.name}</div>
        <div className="text-xs opacity-70 truncate">@{user.username}</div>
      </div>
      {user.is_pro && <Badge color="gold">PRO</Badge>}
      {right && <div className="ml-2">{right}</div>}
    </div>
  );
}
