// src/components/GroupAvatar.tsx
type Props = {
  name?: string
  src?: string
  size?: number
  className?: string
}

const DEFAULT_BG = "var(--tg-link-color)"

const GroupAvatar = ({
  name = "",
  src,
  size = 72,
  className = "",
}: Props) => {
  // Если есть картинка
  if (src) {
    return (
      <div
        className={`
          relative flex items-center justify-center
          rounded-[22px]
          shadow-[0_6px_24px_0_rgba(83,147,231,0.20)]
          ring-2 ring-[var(--tg-card-bg)]
          ${className}
        `}
        style={{
          width: size,
          height: size,
        }}
      >
        <img
          src={src}
          alt={name || "group-avatar"}
          width={size}
          height={size}
          style={{
            borderRadius: 22,
            background: DEFAULT_BG,
          }}
          className="object-cover w-full h-full"
        />
      </div>
    )
  }

  // Без картинки — буква группы на цветном фоне
  return (
    <div
      className={`
        relative flex items-center justify-center
        font-bold text-white select-none
        rounded-[22px]
        shadow-[0_6px_24px_0_rgba(83,147,231,0.20)]
        ring-2 ring-[var(--tg-card-bg)]
        ${className}
      `}
      style={{
        width: size,
        height: size,
        background: DEFAULT_BG,
        fontSize: size ? size / 2 : 36,
      }}
    >
      {name?.[0]?.toUpperCase() || "G"}
    </div>
  )
}

export default GroupAvatar
