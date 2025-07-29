// src/components/Avatar.tsx

type Props = { name?: string; src?: string; size?: number }

const Avatar = ({ name = "", src, size = 56 }: Props) => {
  if (src)
    return (
      <img
        src={src}
        alt={name || "avatar"}
        width={size}
        height={size}
        className="rounded-full object-cover border border-[var(--tg-hint-color)]"
      />
    )
  const bg = "#59a3fa"
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold select-none"
      style={{ width: size, height: size, background: bg, fontSize: size ? size / 2 : 24 }}
    >
      {name?.[0] || "U"}
    </div>
  )
}

export default Avatar
