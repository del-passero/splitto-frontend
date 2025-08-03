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
        w-full flex items-center relative
        bg-[var(--tg-card-bg)]
        border border-[var(--tg-hint-color)]
        rounded-3xl
        px-7 py-6
        min-h-[130px]
        shadow-[0_12px_40px_-10px_rgba(83,147,231,0.15)]
        overflow-hidden
        ${className}
      `}
      aria-label={group.name}
      style={{
        minHeight: 130,
        boxShadow:
          "0 8px 28px 0 rgba(83,147,231,0.10), 0 16px 40px -16px rgba(50,60,90,0.10)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Внутренний matte-иннер-шадоу */}
      <div
        className="
          pointer-events-none
          absolute inset-0 rounded-3xl z-0
        "
        style={{
          boxShadow: "inset 0 2px 24px 0 rgba(83,147,231,0.05)",
        }}
      />
      {/* Аватар группы с glow подложкой */}
      <div className="flex-shrink-0 mr-7 relative z-10">
        {/* Glow-подсветка под аватаром */}
        <div
          className="absolute inset-0 flex items-center justify-center z-0"
          style={{
            filter: "blur(20px)",
            opacity: 0.17,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: 32,
              background: "var(--tg-link-color)",
            }}
          />
        </div>
        <GroupAvatar
          name={group.name}
          size={AVATAR_SIZE}
          className="relative z-10"
        />
      </div>
      {/* Правая часть */}
      <div className="flex flex-col justify-center flex-1 min-w-0 z-10">
        {/* Верх: название группы и баланс/статус */}
        <div className="flex items-center justify-between w-full mb-3">
          <div className="text-2xl font-extrabold text-[var(--tg-text-color)] truncate">
            {group.name}
          </div>
          <div className="text-xs text-[var(--tg-hint-color)] ml-4 shrink-0">
            {t("debts_reserved")}
          </div>
        </div>
        {/* Участники */}
        <div className="flex items-center min-h-[28px] gap-3">
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
