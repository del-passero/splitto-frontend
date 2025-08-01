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

const GroupCard = ({
  group,
  onClick,
  maxAvatars = 5,
  className = ""
}: Props) => {
  const { t } = useTranslation()

  // Локальное состояние для участников, если они не пришли в списке
  const [members, setMembers] = useState<GroupMember[]>(group.members || [])

  useEffect(() => {
    if (!group.members) {
      getGroupDetails(group.id)
        .then(data => {
          if (data.members) setMembers(data.members)
        })
        .catch(err => console.error("Ошибка загрузки участников:", err))
    }
  }, [group.id, group.members])

  const ownerId = group.owner_id

  // Сортировка: владелец первый
  const sortedMembers = [
    ...members.filter(m => (m.user ? m.user.id === ownerId : m.id === ownerId)),
    ...members.filter(m => (m.user ? m.user.id !== ownerId : m.id !== ownerId))
  ]

  const displayedMembers = sortedMembers.slice(0, maxAvatars)
  const hiddenCount = sortedMembers.length - displayedMembers.length

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-3 border-b border-[var(--tg-secondary-bg-color)] ${className}`}
      aria-label={group.name}
    >
      {/* Левая часть: аватар группы + название + участники */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Аватар группы */}
        <GroupAvatar name={group.name} size={40} />

        {/* Название и аватары участников */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="text-base font-semibold text-[var(--tg-text-color)] truncate">
            {group.name}
          </div>

          {/* Аватары участников */}
          {members.length > 0 ? (
            <div className="flex items-center mt-1">
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
                      width: idx === 0 ? 38 : 32,
                      height: idx === 0 ? 38 : 32,
                      marginLeft: idx > 0 ? -10 : 0,
                      zIndex: maxAvatars - idx
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
                      size={idx === 0 ? 38 : 32}
                    />
                  </div>
                )
              })}
              {/* +N, если участников больше, чем maxAvatars */}
              {hiddenCount > 0 && (
                <div
                  className="flex items-center justify-center rounded-full border-2 border-[var(--tg-card-bg)] bg-[var(--tg-link-color)] text-white font-semibold text-xs ml-1"
                  style={{ width: 32, height: 32 }}
                >
                  +{hiddenCount}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-[var(--tg-hint-color)] mt-1">
              {t("members_count", { count: group.members_count }) ||
                `${group.members_count} участников`}
            </div>
          )}
        </div>
      </div>

      {/* Правая часть: placeholder для долгов */}
      <div className="text-xs text-[var(--tg-hint-color)] ml-3 shrink-0">
        {t("debts_reserved")}
      </div>
    </button>
  )
}

export default GroupCard
