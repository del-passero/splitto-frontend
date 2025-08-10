// src/components/GroupCard.tsx

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

const AVATAR_SIZE = 52
const PARTICIPANT_SIZE = 24
const MAX_DISPLAYED = 4

const GroupCard = ({
  group,
  onClick,
  maxAvatars = MAX_DISPLAYED,
  className = "",
}: Props) => {
  const { t } = useTranslation()

  // Универсально достаем участников (детали или превью)
  const members: GroupMember[] = useMemo(() => {
    if ("members" in group && Array.isArray((group as any).members) && (group as any).members.length > 0) {
      return (group as any).members
    }
    if ("preview_members" in group && Array.isArray((group as any).preview_members)) {
      return (group as any).preview_members
    }
    return []
  }, [group])

  // Владелец первым
  const sortedMembers = useMemo(() => {
    if (!members.length) return []
    return [
      ...members.filter((m) => m.user.id === (group as any).owner_id),
      ...members.filter((m) => m.user.id !== (group as any).owner_id),
    ]
  }, [members, (group as any).owner_id])

  const displayedMembers = sortedMembers.slice(0, maxAvatars)
  const hiddenCount = Math.max(0, sortedMembers.length - maxAvatars)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center relative
        rounded-xl
        px-4 py-3
        min-h-[76px]
        border bg-[var(--tg-card-bg)]
        border-[var(--tg-hint-color)]
        shadow-[0_4px_18px_-10px_rgba(83,147,231,0.14)]
        hover:shadow-[0_10px_28px_-12px_rgba(83,147,231,0.20)]
        active:scale-[0.99]
        transition
        cursor-pointer
        overflow-hidden
        ${className}
      `}
      aria-label={(group as any).name}
    >
      {/* Аватар слева */}
      <div className="flex-shrink-0 relative mr-4">
        <GroupAvatar
          name={(group as any).name}
          size={AVATAR_SIZE}
          className="relative"
        />
      </div>

      {/* Контент */}
      <div className="flex flex-col justify-center flex-1 min-w-0">
        <div className="flex items-center justify-between w-full">
          <div className="text-base font-semibold text-[var(--tg-text-color)] truncate">
            {(group as any).name}
          </div>
          <div className="text-[11px] text-[var(--tg-hint-color)] ml-3 shrink-0">
            {t("debts_reserved")}
          </div>
        </div>

        {/* Участники */}
        <div className="flex items-center mt-2 min-h-[24px]">
          {displayedMembers.map((member, idx) => (
            <div
              key={member.id}
              className="rounded-full border flex items-center justify-center bg-[var(--tg-bg-color)]"
              style={{
                borderColor: "var(--tg-card-bg)",
                width: PARTICIPANT_SIZE,
                height: PARTICIPANT_SIZE,
                marginLeft: idx > 0 ? -8 : 0,
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
            <span className="ml-2 text-[11px] text-[var(--tg-hint-color)]">
              {t("and_more_members", { count: hiddenCount }) || `и ещё ${hiddenCount}`}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export default GroupCard
