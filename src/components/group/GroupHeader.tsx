// src/components/group/GroupHeader.tsx

import { useMemo } from "react"
import { Settings, Pencil, LogOut, Trash2 } from "lucide-react"
import GroupAvatar from "../GroupAvatar"
import Avatar from "../Avatar"
import { useTranslation } from "react-i18next"
import type { Group } from "../../types/group"
import type { GroupMember } from "../../types/group_member"

type Props = {
  group: Group
  members: GroupMember[]
  isOwner: boolean
  onSettings: () => void
  onEdit: () => void
  onLeave: () => void
  onDelete: () => void
}

const AVATAR_SIZE = 64
const PARTICIPANT_SIZE = 28
const MAX_DISPLAYED = 6

const GroupHeader = ({
  group,
  members,
  isOwner,
  onSettings,
  onEdit,
  onLeave,
  onDelete,
}: Props) => {
  const { t } = useTranslation()

  // Владелец всегда первым
  const sortedMembers = useMemo(() => {
    if (!members.length) return []
    return [
      ...members.filter((m) => m.user.id === group.owner_id),
      ...members.filter((m) => m.user.id !== group.owner_id),
    ]
  }, [members, group.owner_id])

  const displayedMembers = sortedMembers.slice(0, MAX_DISPLAYED)
  const hiddenCount = Math.max(0, sortedMembers.length - MAX_DISPLAYED)

  return (
    <div className="flex flex-row w-full items-start px-4 py-4 bg-[var(--tg-bg-color)]">
      {/* Аватар группы */}
      <div className="flex-shrink-0 mr-4">
        <GroupAvatar
          name={group.name}
          size={AVATAR_SIZE}
          className="shadow"
        />
      </div>
      {/* Центр: инфо о группе */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center flex-wrap gap-2">
          <div className="font-bold text-xl break-words text-[var(--tg-text-color)]">
            {group.name}
          </div>
          {/* 
          // Если появится поле is_archived — раскомментируй!
          {group.is_archived && (
            <span className="flex items-center text-xs text-[var(--tg-hint-color)] ml-2">
              <Lock className="w-4 h-4 mr-1" /> {t("group_status_archived", "Архив")}
            </span>
          )}
          */}
        </div>
        {group.description && (
          <div className="mt-1 text-sm text-[var(--tg-hint-color)] whitespace-pre-line break-words">
            {group.description}
          </div>
        )}
        {/* Участники */}
        <div className="mt-3 flex flex-col">
          <div className="flex items-center min-h-[28px]">
            {displayedMembers.map((member, idx) => (
              <div
                key={member.id}
                className="rounded-full border-2 flex items-center justify-center bg-[var(--tg-bg-color)]"
                style={{
                  borderColor: "var(--tg-card-bg)",
                  width: PARTICIPANT_SIZE,
                  height: PARTICIPANT_SIZE,
                  marginLeft: idx > 0 ? -10 : 0,
                  zIndex: MAX_DISPLAYED - idx,
                }}
                title={
                  member.user.first_name
                    ? `${member.user.first_name} ${member.user.last_name || ""}`.trim()
                    : member.user.username || ""
                }
              >
                <Avatar
                  name={
                    member.user.first_name
                      ? `${member.user.first_name} ${member.user.last_name || ""}`.trim()
                      : member.user.username || ""
                  }
                  src={member.user.photo_url}
                  size={PARTICIPANT_SIZE}
                />
              </div>
            ))}
            {hiddenCount > 0 && (
              <span className="ml-2 text-xs text-[var(--tg-hint-color)]">
                {t("and_more_members", { count: hiddenCount })}
              </span>
            )}
          </div>
          <span className="mt-1 text-xs text-[var(--tg-hint-color)]">
            {t("group_members_count", {
              count: members.length,
              defaultValue: "{{count}} участников",
            })}
          </span>
        </div>
      </div>
      {/* Правая колонка: кнопки действий */}
      <div className="flex flex-col items-end space-y-2 ml-4">
        <button aria-label={t("settings")} onClick={onSettings}>
          <Settings className="w-6 h-6 text-[var(--tg-accent-color)]" />
        </button>
        {isOwner && (
          <button aria-label={t("edit_group", "Редактировать группу")} onClick={onEdit}>
            <Pencil className="w-6 h-6 text-[var(--tg-accent-color)]" />
          </button>
        )}
        <button
          aria-label={t("leave_group", "Выйти из группы")}
          onClick={onLeave}
        >
          <LogOut className="w-6 h-6 text-red-500" />
        </button>
        {isOwner && (
          <button
            aria-label={t("delete_group", "Удалить группу")}
            onClick={onDelete}
          >
            <Trash2 className="w-6 h-6 text-red-500" />
          </button>
        )}
      </div>
    </div>
  )
}

export default GroupHeader
