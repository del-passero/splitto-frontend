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

  // Рендерим через общий компонент табов без дополнительных внешних контейнеров,
  // чтобы отступы были один-в-один как в GroupTabs.
  return (
    <GroupTabs<TabKey>
      selected={selected}
      onSelect={onSelect}
      tabs={TABS}
      className={className}
    />
  )
}

export default GroupSettingsTabs
