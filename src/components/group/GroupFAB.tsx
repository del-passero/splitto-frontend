// src/components/group/GroupFAB.tsx

import { useRef, useState, useEffect } from "react"
import { HandCoins } from "lucide-react"
import { useTranslation } from "react-i18next"

type Props = {
  onClick: () => void
  className?: string
}

const GroupFAB = ({ onClick, className = "" }: Props) => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(true)
  const fabRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let lastScroll = window.scrollY
    const onScroll = () => {
      const current = window.scrollY
      setVisible(current < lastScroll || current < 10)
      lastScroll = current
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      ref={fabRef}
      className={`
        fixed z-50
        right-6 bottom-[calc(90px+env(safe-area-inset-bottom,24px))]
        transition-opacity
        ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        ${className}
      `}
    >
      <button
        type="button"
        aria-label={t("group_fab_add_transaction")}
        onClick={onClick}
        className={`
          w-16 h-16 rounded-full
          bg-[var(--tg-link-color)] text-white
          flex items-center justify-center
          border border-white/80 shadow-xl
          shadow-[0_4px_16px_0_rgba(34,105,255,0.14)]
          transition hover:scale-105 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-white/40
        `}
        style={{
          transition: "box-shadow 0.2s, transform 0.1s",
        }}
      >
        <HandCoins className="w-8 h-8" />
      </button>
    </div>
  )
}

export default GroupFAB
