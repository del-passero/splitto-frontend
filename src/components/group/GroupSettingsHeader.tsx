// src/components/group/GroupSettingsHeader.tsx

import GroupAvatar from "../GroupAvatar"
import { Pencil, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Group } from "../../types/group"

type Props = {
  group: Group
  onEdit: () => void
  onBack: () => void
}

const GroupSettingsHeader = ({ group, onEdit, onBack }: Props) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center px-4 py-5 border-b border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)] relative">
      {/* Кнопка "Назад" (красный крестик) */}
      <button
        type="button"
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-red-500/10 transition"
        onClick={onBack}
        aria-label={t("group_settings_close")}
      >
        <X className="w-6 h-6 text-red-500" />
      </button>
      <GroupAvatar name={group.name} size={60} className="mr-4 ml-8" />
      <div className="flex flex-col flex-grow min-w-0">
        <div className="font-bold text-lg break-words text-[var(--tg-text-color)] leading-tight">
          {group.name}
        </div>
        {group.description && (
          <div className="mt-1 text-sm text-[var(--tg-hint-color)] whitespace-pre-line break-words">
            {group.description}
          </div>
        )}
      </div>
      <button
        type="button"
        className="ml-4 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
        onClick={onEdit}
        aria-label={t("edit_group")}
      >
        <Pencil className="w-6 h-6 text-[var(--tg-accent-color)]" />
      </button>
    </div>
  )
}

export default GroupSettingsHeader
