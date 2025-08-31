// src/components/group/GroupTabs.tsx

import { useTranslation } from "react-i18next"

type Tab<T extends string> = {
  key: T
  label: string
}
type Props<T extends string> = {
  selected: T
  onSelect: (key: T) => void
  tabs?: Tab<T>[]
  className?: string
}

function GroupTabs<T extends string>({
  selected,
  onSelect,
  tabs,
  className = "",
}: Props<T>) {
  const { t } = useTranslation()
  const TABS: Tab<T>[] = tabs || [
    { key: "transactions" as T, label: t("group_tab_transactions") },
    { key: "balance" as T, label: t("group_tab_balance") },
    { key: "analytics" as T, label: t("group_tab_analytics") },
  ]

  // ⬇️ БЕЗ CardSection. Никакого фонового “карточного” цвета —
  // работаем прямо поверх bg-[var(--tg-bg-color)] как на Contacts.
  return (
    <div className={`w-full mb-2 ${className}`}>
      <div className="flex w-full max-w-sm mx-auto relative">
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
    </div>
  )
}

export default GroupTabs
