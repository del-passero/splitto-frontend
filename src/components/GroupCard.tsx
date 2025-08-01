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

  // Локальный state для участников, если их нет в group.members
  const [members, setMembers] = useState<GroupMember[]>(group.members || [])

  useEffect(() => {
    // Если участников нет — подгружаем детали группы
    if (!group.members) {
      getGroupDetails(group.id)
        .then(data => {
          if (data.members) setMembers(data.members)
        })
        .catch(err => {
          console.error("Ошибка загрузки участников для карточки:", err)
        })
    }
  }, [group.id, group.members])

  const ownerId = group.owner_id

  // Сортируем участников: владелец первый
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
      className={`
        w-full flex items-center justify-between p-3 mb-3 rounded-2xl
        bg-[var(--tg-card-bg)] shadow-tg-card
        hover:bg-[var(--tg-link-color)]/10 transition
        ${className}
      `}
      aria-label={group.name}
    >
      {/* Аватар группы */}
      <GroupAvatar name={group.name} size={54} className="mr-4 flex-shrink-0" />

      {/* Название и аватары участников */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-lg truncate text-[var(--tg-text-color)]">
          {group.name}
        </div>

        {members.length > 0 ? (
          <div className="flex items-center mt-1">
            {displayedMembers.map((member, idx) => {
              const user = member.user || member
              return (
                <div
                  key={user.id}
                  className={`rounded-full border-2 ${
                    idx === 0 ? "border-[var(--tg-link-color)]" : "border-[var(--tg-card-bg)]"
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
          <div className="text-sm text-[var(--tg-hint-color)] mt-1">
            {t("members_count", { count: group.members_count }) ||
              `${group.members_count} участников`}
          </div>
        )}
      </div>

      {/* Справа заглушка под долги */}
      <div className="flex flex-col items-end min-w-[88px] ml-4">
        <span className="text-[var(--tg-hint-color)] text-xs font-medium">
          {t("debts_reserved")}
        </span>
      </div>
    </button>
  )
}

export default GroupCard
