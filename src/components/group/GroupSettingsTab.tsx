// src/components/group/GroupSettingsTab.tsx

import { useTranslation } from "react-i18next"

type Props = {
  isOwner: boolean
  onLeave: () => void
  onDelete: () => void
  onSaveAndExit: () => void
}

const GroupSettingsTab = ({
  isOwner,
  onLeave,
  onDelete,
  onSaveAndExit,
}: Props) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 p-4 min-h-[280px]">
      <button
        onClick={onLeave}
        className="w-full py-3 rounded-lg font-medium bg-[var(--tg-hint-color)] text-[var(--tg-text-color)] transition active:scale-95"
        type="button"
        aria-label={t("group_settings_leave_group")}
      >
        {t("group_settings_leave_group")}
      </button>
      {isOwner && (
        <button
          onClick={onDelete}
          className="w-full py-3 rounded-lg font-medium bg-red-500 text-white mt-8 transition active:scale-95"
          type="button"
          aria-label={t("group_settings_delete_group")}
        >
          {t("group_settings_delete_group")}
        </button>
      )}
      {/* Кнопка "Сохранить и выйти" */}
      <div className="flex-1" />
      <button
        onClick={onSaveAndExit}
        className="mt-8 w-full py-3 rounded-lg font-semibold bg-[var(--tg-accent-color)] text-white shadow transition active:scale-95"
        type="button"
        aria-label={t("group_settings_save_and_exit")}
      >
        {t("group_settings_save_and_exit")}
      </button>
    </div>
  )
}

export default GroupSettingsTab
