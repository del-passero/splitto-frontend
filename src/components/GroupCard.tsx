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

const AVATAR_SIZE = 56
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
        w-full flex items-center relative
        rounded-3xl
        px-6 py-4
        min-h-[88px] max-h-[120px]
        shadow-[0_8px_32px_-10px_rgba(83,147,231,0.14)]
        border border-[var(--tg-hint-color)]
        overflow-hidden
        bg-white/80 dark:bg-[#232b3bcc]/60
        backdrop-blur-md
        ${className}
      `}
      aria-label={group.name}
      style={{
        minHeight: 88,
        maxHeight: 120,
        // Glass/blur + две разные тени для ещё большего премиума:
        boxShadow: "0 8px 32px -10px rgba(83,147,231,0.16), 0 1.5px 7px 0 rgba(49,130,206,0.06)",
        border: "1.5px solid var(--tg-hint-color)",
        background: "rgba(255,255,255,0.80)",
        backdropFilter: "blur(11px)",
        WebkitBackdropFilter: "blur(11px)",
      }}
    >
      {/* Аватар группы с легкой полупрозрачной подложкой */}
      <div className="flex-shrink-0 relative mr-5">
        <div
          className="absolute inset-0 rounded-[18px] z-0"
          style={{
            background: "rgba(83,147,231,0.10)",
            filter: "blur(8px)",
            opacity: 0.6,
          }}
        />
        <GroupAvatar
          name={group.name}
          size={AVATAR_SIZE}
          className="relative z-10"
        />
      </div>
      {/* Правая часть */}
      <div className="flex flex-col justify-center flex-1 min-w-0 z-10">
        {/* Верх: название группы и баланс/статус */}
        <div className="flex items-center justify-between w-full">
          <div className="text-lg font-bold text-[var(--tg-text-color)] truncate">
            {group.name}
          </div>
          <div className="text-xs text-[var(--tg-hint-color)] ml-3 shrink-0">
            {t("debts_reserved")}
          </div>
        </div>
        {/* Участники */}
        <div className="flex items-center mt-3 min-h-[28px]">
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
