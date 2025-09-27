// src/components/GroupAvatar.tsx
// фото должно работать

type Props = {
  name?: string
  src?: string
  size?: number
  className?: string
}

const RADIUS = 12
const DEFAULT_BG = "var(--tg-link-color)"
const API_URL = (import.meta as any)?.env?.VITE_API_URL || ""

/** Делает абсолютный URL для статики бэкенда, если пришёл относительный `/media/...` */
function resolveSrc(src?: string): string | undefined {
  if (!src) return undefined
  // если уже абсолютный/встроенный — оставляем как есть
  if (/^(https?:|blob:|data:)/i.test(src)) return src

  // относительный путь (например, "/media/group_avatars/abc.jpg")
  if (src.startsWith("/")) {
    // убираем хвост "/api" у базового URL бэка, если он есть
    const base = String(API_URL).replace(/\/+$/, "")
    const origin = base.replace(/\/api\/?$/, "")
    return origin + src
  }

  return src
}

const GroupAvatar = ({
  name = "",
  src,
  size = 52,
  className = "",
}: Props) => {
  const imgSrc = resolveSrc(src)

  // Картинка
  if (imgSrc) {
    return (
      <div
        className={`
          relative flex items-center justify-center
          rounded-xl
          shadow-[0_3px_10px_-4px_rgba(83,147,231,0.20)]
          bg-[var(--tg-card-bg)]
          ${className}
        `}
        style={{ width: size, height: size }}
      >
        <img
          src={imgSrc}
          alt={name || "group-avatar"}
          width={size}
          height={size}
          style={{ borderRadius: RADIUS, background: DEFAULT_BG }}
          className="object-cover w-full h-full"
          loading="lazy"
          decoding="async"
        />
      </div>
    )
  }

  // Буква на фоне
  return (
    <div
      className={`
        relative flex items-center justify-center
        font-bold text-white select-none
        rounded-xl
        shadow-[0_3px_10px_-4px_rgba(83,147,231,0.20)]
        bg-[var(--tg-link-color)]
        ${className}
      `}
      style={{
        width: size,
        height: size,
        fontSize: size ? size / 2 : 26,
        borderRadius: RADIUS,
      }}
      aria-label={name || "group"}
    >
      {name?.[0]?.toUpperCase() || "G"}
    </div>
  )
}

export default GroupAvatar
