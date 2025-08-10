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
  ownerId?: number            // ← НОВОЕ
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
  ownerId,                    // ← НОВОЕ
}: Props) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 p-4 min-h-[280px]">
      {/* Invite/Add кнопки */}
      <div className="flex gap-2 mb-3 mt-0">
        <button
          className="flex-1 py-2 rounded-lg bg-[var(--tg-accent-color)] text-white font-medium flex items-center justify-center gap-2 active:scale-95"
          onClick={onInvite}
          type="button"
        >
          <Share2 className="w-5 h-5" />
          {t("group_members_invite")}
        </button>
        <button
          className="flex-1 py-2 rounded-lg bg-[var(--tg-card-bg)] text-[var(--tg-accent-color)] font-medium flex items-center justify-center gap-2 active:scale-95"
          onClick={onAdd}
          type="button"
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
		ownerId={ownerId}         // ← НОВОЕ
      />

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

export default GroupMembersTab
