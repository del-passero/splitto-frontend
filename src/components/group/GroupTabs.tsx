// src/components/group/GroupTabs.tsx

import { useTranslation } from "react-i18next"

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
    <div className={`w-full flex justify-center mt-2 mb-3 px-2 ${className}`}>
      <div className="flex w-full max-w-sm relative">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`
              flex-1 min-w-0 px-2 pb-2 pt-0 text-[15px] font-medium relative
              bg-transparent border-none outline-none
              transition-colors cursor-pointer
              ${
                selected === tab.key
                  ? "text-[var(--tg-accent-color)]"
                  : "text-[var(--tg-theme-link-color),var(--tg-hint-color)]"
              }
            `}
            onClick={() => onSelect(tab.key)}
          >
            {tab.label}
            {selected === tab.key && (
              <span
                className="
                  absolute left-1/2 -translate-x-1/2 bottom-0
                  w-3/5 h-[3px] rounded bg-[var(--tg-accent-color)]
                  transition-all duration-200
                  pointer-events-none
                "
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default GroupTabs
