// src/components/group/GroupTabs.tsx

import { useTranslation } from "react-i18next"
import CardSection from "../CardSection"

type TabKey = "transactions" | "balance" | "analytics"
type Props = {
  selected: TabKey
  onSelect: (key: TabKey) => void
  className?: string
}

const GroupTabs = ({ selected, onSelect, className = "" }: Props) => {
  const { t } = useTranslation()
  const TABS: { key: TabKey; label: string }[] = [
    { key: "transactions", label: t("group_tab_transactions") },
    { key: "balance", label: t("group_tab_balance") },
    { key: "analytics", label: t("group_tab_analytics") },
  ]
  return (
    <CardSection className={`pt-0 pb-0 px-0 mb-2 ${className}`}>
      <div className="flex w-full max-w-sm mx-auto relative bg-transparent">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            className={`
              flex-1 min-w-0 px-2 pb-2 pt-0 text-[15px] font-bold relative
              bg-transparent border-none outline-none
              transition-colors cursor-pointer
              ${
                selected === tab.key
                  ? "text-[color:var(--tg-accent-color,#3C8DD9)]"
                  : "text-[color:var(--tg-hint-color,#929292)]"
              }
            `}
          >
            {tab.label}
            {selected === tab.key && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-[3px] bg-[color:var(--tg-accent-color,#3C8DD9)] rounded transition-all duration-200 pointer-events-none"
              />
            )}
          </button>
        ))}
      </div>
    </CardSection>
  )
}

export default GroupTabs
