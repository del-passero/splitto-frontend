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
  size = 56,
  className = "",
}: Props) => {
  // Если есть картинка
  if (src) {
    return (
      <div
        className={`
          relative flex items-center justify-center
          rounded-[18px]
          shadow-[0_4px_14px_0_rgba(83,147,231,0.17)]
          ring-2 ring-[var(--tg-card-bg)]
          bg-[var(--tg-link-color)]
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
            borderRadius: 18,
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
        rounded-[18px]
        shadow-[0_4px_14px_0_rgba(83,147,231,0.17)]
        ring-2 ring-[var(--tg-card-bg)]
        bg-[var(--tg-link-color)]
        ${className}
      `}
      style={{
        width: size,
        height: size,
        fontSize: size ? size / 2 : 28,
      }}
    >
      {name?.[0]?.toUpperCase() || "G"}
    </div>
  )
}

export default GroupAvatar
