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
}

const GroupMembersTab = ({
  members,
  isOwner,
  onRemove,
  onInvite,
  onAdd,
  onSaveAndExit,
  loading = false,
}: Props) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 p-4 min-h-[280px]">
      {/* Invite/Add кнопки - стиль Wallet */}
      <div className="flex justify-center mt-6 mb-6">
        <div className="flex w-full max-w-[320px] h-11 rounded-full border border-[color:var(--tg-accent-color,#40A7E3)] bg-[var(--tg-card-bg)] p-1">
          <button
            type="button"
            className={`
              flex-1 h-9 rounded-full font-bold text-sm transition flex items-center justify-center gap-2
              bg-[color:var(--tg-accent-color,#40A7E3)] text-white shadow
            `}
            onClick={onInvite}
          >
            <Share2 className="w-5 h-5" />
            {t("group_members_invite")}
          </button>
          <button
            type="button"
            className={`
              flex-1 h-9 rounded-full font-bold text-sm transition flex items-center justify-center gap-2
              bg-transparent text-[color:var(--tg-accent-color,#40A7E3)]
            `}
            onClick={onAdd}
          >
            <UserPlus className="w-5 h-5" />
            {t("group_members_add")}
          </button>
        </div>
      </div>

      <GroupMembersList
        members={members}
        loading={loading}
        isOwner={isOwner}
        onRemove={onRemove}
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
