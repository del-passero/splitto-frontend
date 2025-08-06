// src/components/group/GroupFAB.tsx

import { HandCoins } from "lucide-react"
import { useTranslation } from "react-i18next"

type Props = {
  onClick: () => void
  className?: string
}

const GroupFAB = ({ onClick, className = "" }: Props) => {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className={`
        fixed z-50
        right-6 bottom-[calc(90px+env(safe-area-inset-bottom,24px))]
        w-16 h-16 rounded-full
        bg-[var(--tg-link-color)] text-white
        flex items-center justify-center
        border border-white/80 shadow-xl
        shadow-[0_4px_16px_0_rgba(34,105,255,0.14)]
        transition hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-white/40
        ${className}
      `}
      onClick={onClick}
      aria-label={t("group_fab_add_transaction")}
      style={{
        transition: "box-shadow 0.2s, transform 0.1s",
      }}
    >
      <HandCoins className="w-8 h-8" />
    </button>
  )
}

export default GroupFAB
