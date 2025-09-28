// src/components/group/GroupMembersTab.tsx
import { useTranslation } from "react-i18next"
import { Share2, UserPlus, LogOut } from "lucide-react"
import type { GroupMember } from "../../types/group_member"
import GroupMembersList from "./GroupMembersList"
import CardSection from "../CardSection"

type Props = {
  members: GroupMember[]
  isOwner: boolean
  onRemove: (memberId: number) => void
  onInvite: () => void
  onAdd: () => void
  onSaveAndExit: () => void
  onLeave: () => void
  loading?: boolean
  fetchMore?: () => void
  hasMore?: boolean
  ownerId?: number
  /** Можно скрыть кнопку «Выйти из группы», например, для владельца или архивной группы */
  canLeave?: boolean
}

const GroupMembersTab = ({
  members,
  isOwner,
  onRemove,
  onInvite,
  onAdd,
  onSaveAndExit,
  onLeave,
  loading = false,
  fetchMore,
  hasMore,
  ownerId,
  canLeave = true,
}: Props) => {
  const { t } = useTranslation()

  return (
    <CardSection className="flex flex-col gap-3 p-4 min-h-[280px]">
      {/* === Кнопки Invite/Add — edge-to-edge, как на табе Настройки === */}
      <div className="-mx-4">
        <CardSection className="px-4 py-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onInvite}
              aria-label={t("group_members_invite")}
              className="flex-1 rounded-lg font-semibold
                         text-white
                         bg-[var(--tg-accent-color,#40A7E3)]
                         hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                         active:scale-95 transition
                         shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                         border border-[var(--tg-hint-color)]/20
                         flex items-center justify-center gap-2
                         py-2"
            >
              <Share2 className="w-5 h-5" />
              {t("group_members_invite")}
            </button>

            <button
              type="button"
              onClick={onAdd}
              aria-label={t("group_members_add")}
              className="flex-1 rounded-lg font-semibold
                         text-white
                         bg-[var(--tg-accent-color,#40A7E3)]
                         hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                         active:scale-95 transition
                         shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                         border border-[var(--tg-hint-color)]/20
                         flex items-center justify-center gap-2
                         py-2"
            >
              <UserPlus className="w-5 h-5" />
              {t("group_members_add")}
            </button>
          </div>
        </CardSection>
      </div>

      {/* === Список участников — edge-to-edge (сам список уже отрисовывает CardSection) === */}
      <div className="-mx-4">
        <GroupMembersList
          members={members}
          loading={loading}
          fetchMore={fetchMore}
          hasMore={hasMore}
          isOwner={isOwner}
          onRemove={onRemove}
          ownerId={ownerId}
        />
      </div>

      <div className="flex-1" />

      {/* === Нижние кнопки (Выйти / Закрыть) — edge-to-edge === */}
      <div className="-mx-4">
        <CardSection className="px-4 py-3">
          <div className="flex flex-col gap-2">
            {/* Выйти из группы */}
            {canLeave && (
              <button
                type="button"
                onClick={onLeave}
                aria-label={t("group_settings_leave_group")}
                className="w-full rounded-lg font-semibold
                           text-black
                           bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                           hover:bg-[color:var(--tg-theme-button-color,#40A7E3)]/10
                           active:scale-95 transition
                           border border-[var(--tg-hint-color)]/30
                           flex items-center justify-center gap-2
                           py-2"
              >
                <LogOut className="w-5 h-5" />
                {t("group_settings_leave_group")}
              </button>
            )}

            {/* Закрыть — вместо «Сохранить и выйти» */}
            <button
              type="button"
              onClick={onSaveAndExit}
              aria-label={t("close")}
              className="w-full rounded-lg font-semibold
                         text-white
                         bg-[var(--tg-accent-color,#40A7E3)]
                         hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                         active:scale-95 transition
                         shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                         border border-[var(--tg-hint-color)]/20
                         py-2"
            >
              {t("close")}
            </button>
          </div>
        </CardSection>
      </div>
    </CardSection>
  )
}

export default GroupMembersTab
