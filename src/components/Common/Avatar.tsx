// src/components/Common/Avatar.tsx
import type { User } from "../../types/user";

export default function Avatar({ user, size = 56 }: { user: User; size?: number }) {
  const initials = (user.first_name?.[0] ?? "") + (user.last_name?.[0] ?? "");
  return user.photo_url ? (
    <img
      src={user.photo_url}
      alt={user.name}
      className="rounded-full object-cover border border-[var(--tg-theme-hint-color)] shadow"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center font-bold shadow"
      style={{
        width: size,
        height: size,
        background: "var(--tg-theme-hint-color, #e0e0e0)",
        color: "var(--tg-theme-text-color, #222)",
        fontSize: size * 0.42,
      }}
    >
      {initials}
    </div>
  );
}
