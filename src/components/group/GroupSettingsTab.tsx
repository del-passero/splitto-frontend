// src/components/group/GroupSettingsTab.tsx

import { Save, LogOut, Trash2 } from "lucide-react"
import CardSection from "../CardSection"
import { useTranslation } from "react-i18next"

type Props = {
  isOwner: boolean
  onLeave: () => void
  onDelete: () => void
  onSaveAndExit: () => void
  canLeave?: boolean
}

const GroupSettingsTab = ({
  isOwner,
  onLeave,
  onDelete,
  onSaveAndExit,
  canLeave = true, // можно добавить логику, если у пользователя есть долги
}: Props) => {
  const { t } = useTranslation()

  // Временный текст, если нельзя выйти из-за долгов
  const leaveHint = t("group_settings_cannot_leave_due_debt")

  return (
    <CardSection className="flex flex-col gap-0 p-0 min-h-[280px]">
      {/* Сохранить и выйти */}
      <button
        onClick={onSaveAndExit}
        className="w-full py-4 flex items-center justify-center gap-2 font-semibold rounded-none bg-[var(--tg-accent-color)] text-white text-base transition active:scale-95"
        type="button"
        aria-label={t("group_settings_save_and_exit")}
      >
        <Save className="w-5 h-5 mr-1" />
        {t("group_settings_save_and_exit")}
      </button>
      {/* Разделитель */}
      <div className="h-px bg-[var(--tg-hint-color)] opacity-15 mx-4" />
      {/* Покинуть группу */}
      <button
        onClick={onLeave}
        className="w-full py-4 flex items-center justify-center gap-2 font-semibold rounded-none bg-[var(--tg-hint-color)]/30 text-[var(--tg-text-color)] text-base transition active:scale-95"
        type="button"
        aria-label={t("group_settings_leave_group")}
      >
        <LogOut className="w-5 h-5 mr-1" />
        {t("group_settings_leave_group")}
      </button>
      {/* Подсказка для "Покинуть" */}
      {!canLeave && (
        <div className="px-6 pt-2 pb-4 text-[var(--tg-hint-color)] text-xs text-center leading-snug">
          {leaveHint}
        </div>
      )}
      {/* Разделитель */}
      {isOwner && <div className="h-px bg-[var(--tg-hint-color)] opacity-15 mx-4" />}
      {/* Удалить группу (только владелец) */}
      {isOwner && (
        <button
          onClick={onDelete}
          className="w-full py-4 flex items-center justify-center gap-2 font-semibold rounded-none bg-red-500 text-white text-base transition active:scale-95"
          type="button"
          aria-label={t("group_settings_delete_group")}
        >
          <Trash2 className="w-5 h-5 mr-1" />
          {t("group_settings_delete_group")}
        </button>
      )}
    </CardSection>
  )
}

export default GroupSettingsTab
