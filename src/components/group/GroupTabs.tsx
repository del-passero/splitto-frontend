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
            onClick={() => onSelect(tab.key)}
            className={`
              flex-1 min-w-0 px-2 pb-2 pt-0 text-[15px] font-medium relative
              bg-transparent border-none outline-none
              transition-colors cursor-pointer
              ${selected === tab.key ? "text-blue-500" : "text-gray-400"}
            `}
          >
            {tab.label}
            {selected === tab.key && (
              <span
                className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-500 rounded transition-all duration-200 pointer-events-none"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
export default GroupTabs
