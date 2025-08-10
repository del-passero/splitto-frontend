// src/components/GroupAvatar.tsx

type Props = {
  name?: string
  src?: string
  size?: number
  className?: string
}

const RADIUS = 12
const DEFAULT_BG = "var(--tg-link-color)"

const GroupAvatar = ({
  name = "",
  src,
  size = 52,
  className = "",
}: Props) => {
  // Картинка
  if (src) {
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
          src={src}
          alt={name || "group-avatar"}
          width={size}
          height={size}
          style={{ borderRadius: RADIUS, background: DEFAULT_BG }}
          className="object-cover w-full h-full"
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
    >
      {name?.[0]?.toUpperCase() || "G"}
    </div>
  )
}

export default GroupAvatar
