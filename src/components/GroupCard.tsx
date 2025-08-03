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

const AVATAR_SIZE = 72
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
        w-full flex flex-col items-center relative
        bg-[var(--tg-card-bg)]
        border border-[var(--tg-hint-color)]
        rounded-3xl
        pt-12 pb-6 px-5
        shadow-[0_12px_40px_-10px_rgba(83,147,231,0.15)]
        overflow-visible
        transition
        cursor-pointer
        ${className}
      `}
      aria-label={group.name}
      style={{
        minHeight: 220,
        boxShadow:
          "0 8px 28px 0 rgba(83,147,231,0.10), 0 16px 40px -16px rgba(50,60,90,0.10)",
        position: "relative",
      }}
    >
      {/* Фоновый блик сверху (glass) */}
      <div
        className="absolute left-0 right-0 top-0 h-14 rounded-t-3xl pointer-events-none z-0"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 100%)",
        }}
      />
      {/* Аватар "парит" сверху */}
      <div
        className="
          absolute -top-9 left-1/2 -translate-x-1/2 z-10
          drop-shadow-[0_6px_20px_rgba(83,147,231,0.17)]
        "
      >
        <GroupAvatar
          name={group.name}
          size={AVATAR_SIZE}
        />
      </div>
      {/* Контент по центру */}
      <div className="flex flex-col items-center w-full mt-4 z-10">
        {/* Имя группы */}
        <div
          className="
            font-extrabold text-xl text-[var(--tg-text-color)]
            text-center max-w-full truncate
          "
          style={{
            lineHeight: 1.25,
            width: "100%",
            wordBreak: "break-word",
            maxWidth: "100%",
          }}
          title={group.name}
        >
          {group.name}
        </div>
        {/* Участники */}
        <div className="flex items-center mt-4 mb-2 min-h-[28px]">
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
        {/* Баланс/статус */}
        <div className="text-xs text-[var(--tg-hint-color)] text-center mt-3">
          {t("debts_reserved")}
        </div>
      </div>
    </button>
  )
}

export default GroupCard
