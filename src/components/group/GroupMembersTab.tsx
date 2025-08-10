// src/components/group/GroupMembersTab.tsx

import { useTranslation } from "react-i18next"
import GroupMembersList from "./GroupMembersList"
import { UserPlus, Share2 } from "lucide-react"
import type { GroupMember } from "../../types/group_member"

type Props = {
  members: GroupMember[]
  isOwner: boolean
  onRemove: (userId: number) => void
  onInvite: () => void
  onAdd: () => void
  onSaveAndExit: () => void
  loading?: boolean
  fetchMore?: () => void
  hasMore?: boolean
  ownerId?: number
}

const GroupMembersTab = ({
  members,
  isOwner,
  onRemove,
  onInvite,
  onAdd,
  onSaveAndExit,
  loading = false,
  fetchMore,
  hasMore,
  ownerId,
}: Props) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 p-4 min-h-[280px]">
      {/* Invite/Add кнопки */}
      <div className="flex gap-2 mb-3 mt-0">
        {/* Primary (accent) */}
        <button
          type="button"
          onClick={onInvite}
          aria-label={t("group_members_invite")}
          className="flex-1 h-11 rounded-xl font-semibold
                     text-white
                     bg-[var(--tg-accent-color,#40A7E3)]
                     hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                     active:scale-95 transition
                     shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                     border border-[var(--tg-hint-color)]/20
                     flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          {t("group_members_invite")}
        </button>

        {/* Secondary (neutral) */}
        <button
          type="button"
          onClick={onAdd}
          aria-label={t("group_members_add")}
          className="flex-1 h-11 rounded-xl font-semibold
                     text-[var(--tg-text-color)]
                     bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                     hover:bg-[color:var(--tg-theme-button-color,#40A7E3)]/10
                     active:scale-95 transition
                     border border-[var(--tg-hint-color)]/30
                     flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          {t("group_members_add")}
        </button>
      </div>

      <GroupMembersList
        members={members}
        loading={loading}
        isOwner={isOwner}
        onRemove={onRemove}
        fetchMore={fetchMore}
        hasMore={hasMore}
        ownerId={ownerId}
      />

      <div className="flex-1" />

      {/* Save & exit — primary */}
      <button
        type="button"
        onClick={onSaveAndExit}
        aria-label={t("group_settings_save_and_exit")}
        className="mt-8 w-full h-12 rounded-xl font-semibold
                   text-white
                   bg-[var(--tg-accent-color,#40A7E3)]
                   hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                   active:scale-95 transition
                   shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                   border border-[var(--tg-hint-color)]/20"
      >
        {t("group_settings_save_and_exit")}
      </button>
    </div>
  )
}

export default GroupMembersTab
