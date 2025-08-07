// src/components/group/GroupHeader.tsx

import { Settings, Pencil } from "lucide-react"
import GroupAvatar from "../GroupAvatar"
import CardSection from "../CardSection"
import { useTranslation } from "react-i18next"
import type { Group } from "../../types/group"

type Props = {
  group: Group
  onSettingsClick: () => void
  onBalanceClick: () => void
  isEdit?: boolean
}

const GroupHeader = ({
  group,
  onSettingsClick,
  onBalanceClick,
  isEdit = false,
}: Props) => {
  const { t } = useTranslation()

  return (
    <CardSection className="flex items-center px-0 py-0">
      <GroupAvatar
        name={group.name}
        size={56}
        className="mr-4"
      />
      <div className="flex flex-col flex-grow min-w-0">
        <div className="font-bold text-xl break-words text-[var(--tg-text-color)] leading-tight">
          {group.name}
        </div>
        {group.description && (
          <div className="text-[var(--tg-hint-color)] text-sm mt-1 line-clamp-2">
            {group.description}
          </div>
        )}
      </div>
      <button
        className="ml-4 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
        onClick={onSettingsClick}
        aria-label={t("group_header_settings")}
        type="button"
      >
        {isEdit
          ? <Pencil className="w-6 h-6 text-[var(--tg-accent-color)]" />
          : <Settings className="w-6 h-6 text-[var(--tg-accent-color)]" />}
      </button>
    </CardSection>
  )
}

export default GroupHeader
