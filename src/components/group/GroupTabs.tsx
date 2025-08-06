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
    <div
      className={`flex w-full justify-center px-4 mt-2 mb-3 ${className}`}
      role="tablist"
    >
      <div className="flex w-full max-w-sm bg-[var(--tg-card-bg)] rounded-2xl p-1 shadow-sm border border-[var(--tg-hint-color)]/20">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`
              flex-1 py-2 rounded-xl text-sm font-medium transition
              ${selected === tab.key
                ? "bg-[var(--tg-accent-color)] text-white shadow"
                : "text-[var(--tg-accent-color)] bg-transparent"}
            `}
            onClick={() => onSelect(tab.key)}
            role="tab"
            aria-selected={selected === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default GroupTabs
