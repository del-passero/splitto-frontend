// src/components/common/Avatar.tsx
import clsx from "clsx";

export interface AvatarProps {
  photoUrl?: string;
  firstName?: string;
  lastName?: string;
  size?: number;
  className?: string;
}

/**
 * Круглый аватар пользователя: фото, или инициалы, или стандартная иконка
 */
export default function Avatar({ photoUrl, firstName, lastName, size = 48, className }: AvatarProps) {
  const initials =
    (firstName ? firstName[0] : "") + (lastName ? lastName[0] : "");
  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold overflow-hidden",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.43 }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="avatar"
          className="object-cover w-full h-full rounded-full"
          style={{ background: "#f4f4f4" }}
        />
      ) : initials.trim() ? (
        <span>{initials}</span>
      ) : (
        <svg
          width={size}
          height={size}
          fill="none"
          viewBox="0 0 48 48"
        >
          <circle cx="24" cy="24" r="24" fill="#e5e7eb" />
          <path
            d="M24 27c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0 2c-5.333 0-16 2.667-16 8v3h32v-3c0-5.333-10.667-8-16-8z"
            fill="#cbd5e1"
          />
        </svg>
      )}
    </div>
  );
}
