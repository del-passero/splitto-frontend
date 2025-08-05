// src/components/group/GroupSettingsTabs.tsx

import { useTranslation } from "react-i18next"

type TabKey = "settings" | "members"

type Tab = {
  key: TabKey
  label: string
}

type Props = {
  selected: TabKey
  onSelect: (key: TabKey) => void
  className?: string
}

const TABS: Tab[] = [
  { key: "settings", label: "group_settings_tab_settings" },
  { key: "members", label: "group_settings_tab_members" },
]

const GroupSettingsTabs = ({ selected, onSelect, className = "" }: Props) => {
  const { t } = useTranslation()
  return (
    <div
      className={`flex w-full border-b border-[var(--tg-hint-color)] bg-[var(--tg-bg-color)] ${className}`}
      role="tablist"
    >
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={`
            flex-1 py-3 text-center font-medium transition-colors relative
            ${selected === tab.key
              ? "text-[var(--tg-accent-color)] border-b-2 border-[var(--tg-accent-color)] bg-[var(--tg-bg-color)]"
              : "text-[var(--tg-hint-color)]"}
          `}
          onClick={() => onSelect(tab.key)}
          type="button"
          role="tab"
          aria-selected={selected === tab.key}
        >
          {t(tab.label)}
        </button>
      ))}
    </div>
  )
}

export default GroupSettingsTabs
