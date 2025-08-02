// src/components/GroupCard.tsx

import { useEffect, useState } from "react"
import GroupAvatar from "./GroupAvatar"
import Avatar from "./Avatar"
import { useTranslation } from "react-i18next"
import { getGroupDetails } from "../api/groupsApi"
import type { Group, GroupMember } from "../types/group"

type Props = {
  group: Group
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
  const [members, setMembers] = useState<GroupMember[]>(group.members || [])

  useEffect(() => {
    if (!group.members) {
      getGroupDetails(group.id)
        .then(data => {
          if (data.members) setMembers(data.members)
        })
        .catch(() => {})
    }
  }, [group.id, group.members])

  const ownerId = group.owner_id
  const sortedMembers = [
    ...members.filter(m => (m.user ? m.user.id === ownerId : m.id === ownerId)),
    ...members.filter(m => (m.user ? m.user.id !== ownerId : m.id !== ownerId)),
  ]
  const displayedMembers = sortedMembers.slice(0, maxAvatars)
  const hiddenCount = sortedMembers.length - maxAvatars

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center
        bg-[var(--tg-card-bg)]
        border border-[var(--tg-hint-color)]
        rounded-2xl
        px-4 py-3
        min-h-[88px] max-h-[104px]
        transition
        hover:shadow-[0_4px_18px_0_rgba(80,120,180,0.10)]
        hover:border-[var(--tg-link-color)]
        cursor-pointer
        shadow-[0_8px_32px_-20px_rgba(50,60,90,0.15)]
        ${className}
      `}
      aria-label={group.name}
      style={{
        minHeight: 88,
        maxHeight: 104,
        boxShadow:
          "0 2px 10px 0 rgba(83,147,231,0.05), 0 8px 32px -20px rgba(50,60,90,0.13), 0 10px 12px -2px rgba(50,60,90,0.05)",
      }}
    >
      {/* Аватар группы */}
      <GroupAvatar
        name={group.name}
        size={AVATAR_SIZE}
        className="flex-shrink-0"
      />

      {/* Правая часть */}
      <div className="flex flex-col justify-center flex-1 min-w-0 ml-4">
        {/* Верх: название группы и баланс/статус */}
        <div className="flex items-center justify-between w-full">
          <div className="text-lg font-bold text-[var(--tg-text-color)] truncate">
            {group.name}
          </div>
          <div className="text-xs text-[var(--tg-hint-color)] ml-3 shrink-0">
            {t("debts_reserved")}
          </div>
        </div>
        {/* Участники (аватарки в строку, оверлап, "и ещё N") */}
        <div className="flex items-center mt-2 min-h-[28px]">
          {displayedMembers.map((member, idx) => {
            const user = member.user || member
            return (
              <div
                key={user.id}
                className="rounded-full border-2 flex items-center justify-center bg-[var(--tg-bg-color)]"
                style={{
                  borderColor: "var(--tg-card-bg)",
                  width: PARTICIPANT_SIZE,
                  height: PARTICIPANT_SIZE,
                  marginLeft: idx > 0 ? -10 : 0,
                  zIndex: maxAvatars - idx,
                }}
                title={
                  user.first_name
                    ? `${user.first_name} ${user.last_name || ""}`.trim()
                    : user.username || ""
                }
              >
                <Avatar
                  name={
                    user.first_name
                      ? `${user.first_name} ${user.last_name || ""}`.trim()
                      : user.username || ""
                  }
                  src={user.photo_url}
                  size={PARTICIPANT_SIZE}
                />
              </div>
            )
          })}
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
