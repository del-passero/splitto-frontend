// src/components/Users/UserCard.tsx
import type { User } from "../../types/user";
import Avatar from "../Common/Avatar";
import Badge from "../Common/Badge";

export default function UserCard({ user, right }: { user: User; right?: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3 shadow bg-[var(--tg-theme-secondary-bg-color)] cursor-pointer transition hover:shadow-md"
    >
      <Avatar user={user} size={40} />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{user.name}</div>
        <div className="text-xs opacity-70 truncate">@{user.username}</div>
      </div>
      {right && <div className="ml-2">{right}</div>}
    </div>
  );
}
