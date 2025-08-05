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
        fixed bottom-6 right-6 z-40
        w-16 h-16 rounded-full bg-[var(--tg-accent-color)]
        flex items-center justify-center shadow-lg
        text-white transition active:scale-95
        focus:outline-none
        ${className}
      `}
      onClick={onClick}
      aria-label={t("group_fab_add_transaction")}
      style={{
        boxShadow: "0 6px 22px -6px rgba(83,147,231,0.18), 0 2px 8px 0 rgba(50,60,90,0.10)",
        // Поддержка safe-area для мобильных
        right: "max(1.5rem, env(safe-area-inset-right, 24px))",
        bottom: "max(1.5rem, env(safe-area-inset-bottom, 24px))"
      }}
    >
      <HandCoins className="w-8 h-8" />
    </button>
  )
}

export default GroupFAB
