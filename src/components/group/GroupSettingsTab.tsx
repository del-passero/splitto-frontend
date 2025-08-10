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
  canLeave = true,
}: Props) => {
  const { t } = useTranslation()
  const leaveHint = t("group_settings_cannot_leave_due_debt")

  return (
    <CardSection className="flex flex-col gap-3 p-4 min-h-[280px]">
      {/* Save & exit — primary */}
      <button
        type="button"
        onClick={onSaveAndExit}
        aria-label={t("group_settings_save_and_exit")}
        className="w-full h-12 rounded-xl font-semibold
                   text-white
                   bg-[var(--tg-accent-color,#40A7E3)]
                   hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                   active:scale-95 transition
                   shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                   border border-[var(--tg-hint-color)]/20
                   flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {t("group_settings_save_and_exit")}
      </button>

      {/* Leave group — neutral */}
      <button
        type="button"
        onClick={onLeave}
        aria-label={t("group_settings_leave_group")}
        className="w-full h-12 rounded-xl font-semibold
                   text-[var(--tg-text-color)]
                   bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                   hover:bg-[color:var(--tg-theme-button-color,#40A7E3)]/10
                   active:scale-95 transition
                   border border-[var(--tg-hint-color)]/30
                   flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        {t("group_settings_leave_group")}
      </button>

      {!canLeave && (
        <div className="px-1 -mt-2 text-[var(--tg-hint-color)] text-xs text-center leading-snug">
          {leaveHint}
        </div>
      )}

      {/* Delete group — danger (only owner) */}
      {isOwner && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={t("group_settings_delete_group")}
          className="w-full h-12 rounded-xl font-semibold
                     text-white
                     bg-red-500 hover:bg-red-500/90
                     active:scale-95 transition
                     border border-red-500/70
                     flex items-center justify-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          {t("group_settings_delete_group")}
        </button>
      )}
    </CardSection>
  )
}

export default GroupSettingsTab
