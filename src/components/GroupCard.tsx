import { useMemo } from "react"
import GroupAvatar from "./GroupAvatar"
import Avatar from "./Avatar"
import { useTranslation } from "react-i18next"
import type { Group, GroupPreview } from "../types/group"
import type { GroupMember } from "../types/group_member"

type Props = {
  group: GroupPreview | Group
  onClick: () => void
  maxAvatars?: number
  className?: string
}

const AVATAR_SIZE = 72      // крупнее аватар
const PARTICIPANT_SIZE = 28
const MAX_DISPLAYED = 4

const GroupCard = ({
  group,
  onClick,
  maxAvatars = MAX_DISPLAYED,
  className = "",
}: Props) => {
  const { t } = useTranslation()

  // Универсально достаем участников (детали группы или превью)
  const members: GroupMember[] = useMemo(() => {
    if (
      "members" in group &&
      Array.isArray(group.members) &&
      group.members.length > 0
    ) {
      return group.members
    }
    if (
      "preview_members" in group &&
      Array.isArray(group.preview_members)
    ) {
      return group.preview_members
    }
    return []
  }, [group])

  // Владелец всегда первым
  const sortedMembers = useMemo(() => {
    if (!members.length) return []
    return [
      ...members.filter((m) => m.user.id === group.owner_id),
      ...members.filter((m) => m.user.id !== group.owner_id),
    ]
  }, [members, group.owner_id])

  const displayedMembers = sortedMembers.slice(0, maxAvatars)
  const hiddenCount = Math.max(0, sortedMembers.length - maxAvatars)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center
        bg-[var(--tg-card-bg)]
        border border-[var(--tg-hint-color)]
        rounded-3xl
        px-6 py-5
        min-h-[120px] max-h-[148px]
        transition
        cursor-pointer
        shadow-[0_8px_32px_-12px_rgba(50,60,90,0.14)]
        ${className}
      `}
      aria-label={group.name}
      style={{
        minHeight: 120,
        maxHeight: 148,
        boxShadow:
          "0 8px 24px 0 rgba(83,147,231,0.09), 0 12px 40px -16px rgba(50,60,90,0.12)",
      }}
    >
      {/* Аватар группы */}
      <div className="flex-shrink-0 mr-6">
        <GroupAvatar
          name={group.name}
          size={AVATAR_SIZE}
        />
      </div>
      {/* Правая часть */}
      <div className="flex flex-col justify-center flex-1 min-w-0">
        {/* Верх: название группы и баланс/статус */}
        <div className="flex items-center justify-between w-full">
          <div className="text-xl font-bold text-[var(--tg-text-color)] truncate">
            {group.name}
          </div>
          <div className="text-xs text-[var(--tg-hint-color)] ml-3 shrink-0">
            {t("debts_reserved")}
          </div>
        </div>
        {/* Участники */}
        <div className="flex items-center mt-4 min-h-[28px]">
          {displayedMembers.map((member, idx) => (
            <div
              key={member.id}
              className="rounded-full border-2 flex items-center justify-center bg-[var(--tg-bg-color)]"
              style={{
                borderColor: "var(--tg-card-bg)",
                width: PARTICIPANT_SIZE,
                height: PARTICIPANT_SIZE,
                marginLeft: idx > 0 ? -10 : 0,
                zIndex: maxAvatars - idx,
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
              {t("and_more_members", { count: hiddenCount }) || `и ещё ${hiddenCount}`}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export default GroupCard
