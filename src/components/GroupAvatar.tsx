// src/components/GroupAvatar.tsx

type Props = { name?: string; size?: number }

const GroupAvatar = ({ name = "", size = 56 }: Props) => {
  const bg = "#B6C3D1" // можно подобрать другой цвет или кастомизировать через пропсы
  return (
    <div
      className="rounded-xl flex items-center justify-center text-white font-bold select-none"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size ? size / 2 : 24,
        minWidth: size,
        minHeight: size,
        userSelect: "none",
      }}
    >
      {name?.[0]?.toUpperCase() || "G"}
    </div>
  )
}

export default GroupAvatar
