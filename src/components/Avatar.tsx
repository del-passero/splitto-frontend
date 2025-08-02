// src/components/Avatar.tsx

import { useState } from "react"

type Props = {
  name?: string
  src?: string
  size?: number
  className?: string
}

function getInitials(name?: string) {
  if (!name || typeof name !== "string") return "U"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const Avatar = ({ name = "", src, size = 56, className = "" }: Props) => {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(name)
  // Базовые стили и квадратная форма!
  const style = { width: size, height: size, minWidth: size, minHeight: size, fontSize: size ? size / 2.1 : 24 }

  // Если src есть и она ещё не "сломалась" — выводим фото
  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        style={style}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover border border-[var(--tg-hint-color)] bg-[#59a3fa] ${className}`}
        // object-cover даст круглую форму даже если фото странных пропорций!
      />
    )
  }

  // Если нет имени — всё равно выводим U!
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold select-none bg-[#59a3fa] ${className}`}
      style={style}
      title={name || ""}
    >
      {initials}
    </div>
  )
}

export default Avatar
