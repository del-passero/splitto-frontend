// src/components/Avatar.tsx

import { useState } from "react"

type Props = {
  name?: string
  src?: string
  size?: number
  className?: string
}

function getInitials(name?: string) {
  if (!name) return "U"
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase()
}

const Avatar = ({ name = "", src, size = 56, className = "" }: Props) => {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(name)

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        width={size}
        height={size}
        className={`rounded-full object-cover border border-[var(--tg-hint-color)] bg-[#59a3fa] ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold select-none bg-[#59a3fa] ${className}`}
      style={{ width: size, height: size, fontSize: size ? size / 2.1 : 24 }}
      title={name}
    >
      {initials}
    </div>
  )
}

export default Avatar
