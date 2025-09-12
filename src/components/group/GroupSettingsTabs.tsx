// src/components/group/GroupSettingsTabs.tsx

import { useTranslation } from "react-i18next"
import GroupTabs from "./GroupTabs"

type TabKey = "settings" | "members"

type Props = {
  selected: TabKey
  onSelect: (key: TabKey) => void
  className?: string
}

const GroupSettingsTabs = ({ selected, onSelect, className = "" }: Props) => {
  const { t } = useTranslation()
  const TABS = [
    { key: "settings" as TabKey, label: t("group_settings_tab_settings") },
    { key: "members" as TabKey, label: t("group_settings_tab_members") },
  ]
  // рендерим тем же компактным макетом, что и GroupTabs
  return (
    <div className={`w-full ${className}`}>
      <div className="flex w-full max-w-sm mx-auto relative bg-transparent">
        <GroupTabs<TabKey>
          selected={selected}
          onSelect={onSelect}
          tabs={TABS}
        />
      </div>
    </div>
  )
}

export default GroupSettingsTabs

