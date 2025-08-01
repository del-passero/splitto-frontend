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

const AVATAR_SIZE = 44
const PARTICIPANT_SIZE = 24

const GroupCard = ({
  group,
  onClick,
  maxAvatars = 5,
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
  const hiddenCount = sortedMembers.length - displayedMembers.length

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center px-4
        min-h-[76px] bg-transparent transition
        ${className}
      `}
      aria-label={group.name}
      style={{ minHeight: 76 }}
    >
      {/* Аватар группы */}
      <GroupAvatar name={group.name} size={AVATAR_SIZE} className="flex-shrink-0" />

      {/* Правая часть: flex-col, название сверху, аватарки ниже */}
      <div className="flex flex-col justify-center flex-1 min-w-0 ml-4">
        {/* Название группы */}
        <div className="text-[17px] font-bold text-[var(--tg-text-color)] truncate">
          {group.name}
        </div>
        {/* Участники (аватарки ниже названия) */}
        {members.length > 0 ? (
          <div className="flex items-center pt-1">
            {displayedMembers.map((member, idx) => {
              const user = member.user || member
              return (
                <div
                  key={user.id}
                  className={`rounded-full border-2 ${
                    idx === 0
                      ? "border-[var(--tg-link-color)]"
                      : "border-[var(--tg-card-bg)]"
                  } bg-[var(--tg-bg-color)]`}
                  style={{
                    width: idx === 0 ? 28 : PARTICIPANT_SIZE,
                    height: idx === 0 ? 28 : PARTICIPANT_SIZE,
                    marginLeft: idx > 0 ? -7 : 0,
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
                    size={idx === 0 ? 28 : PARTICIPANT_SIZE}
                  />
                </div>
              )
            })}
            {hiddenCount > 0 && (
              <div
                className="flex items-center justify-center rounded-full border-2 border-[var(--tg-card-bg)] bg-[var(--tg-link-color)] text-white font-semibold text-xs ml-1"
                style={{ width: PARTICIPANT_SIZE, height: PARTICIPANT_SIZE }}
              >
                +{hiddenCount}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-[var(--tg-hint-color)] pt-1">
            {t("members_count", { count: group.members_count }) ||
              `${group.members_count} участников`}
          </div>
        )}
      </div>
      {/* Долги по центру по вертикали */}
      <div className="text-xs text-[var(--tg-hint-color)] ml-4 shrink-0 flex items-center">
        {t("debts_reserved")}
      </div>
    </button>
  )
}

export default GroupCard
