// src/components/GroupCard.tsx

/**
 * Карточка группы для списка на странице "Группы".
 * Строго рабочий вариант — как было!
 */

import GroupAvatar from "./GroupAvatar"
import Avatar from "./Avatar"
import { useTranslation } from "react-i18next"
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

  // Если group.members нет — подстраховка (чтобы не падало!)
  const members: GroupMember[] = group.members || []
  const ownerId = group.owner_id
  // Владелец первый, остальные после
  const sortedMembers = [
    ...members.filter(m => m.user.id === ownerId),
    ...members.filter(m => m.user.id !== ownerId),
  ]
  // maxAvatars для аватаров
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
      {/* Левая часть — аватар группы */}
      <GroupAvatar name={group.name} size={54} className="mr-4 flex-shrink-0" />

      {/* Центральная часть — название и аватарки участников */}
      <div className="flex-1 min-w-0">
        {/* Название группы */}
        <div className="font-semibold text-lg truncate text-[var(--tg-text-color)]">{group.name}</div>
        {/* Ряд аватаров участников */}
        <div className="flex items-center mt-1 space-x-[-12px]">
          {displayedMembers.map((member, idx) => (
            <div
              key={member.user.id}
              className={`
                rounded-full
                ${idx === 0 ? "border-2 border-[var(--tg-link-color)]" : "border-2 border-[var(--tg-card-bg)]"}
                bg-[var(--tg-bg-color)]
              `}
              style={{
                width: idx === 0 ? 38 : 32,
                height: idx === 0 ? 38 : 32,
                marginLeft: idx > 0 ? -10 : 0,
                zIndex: maxAvatars - idx
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
                size={idx === 0 ? 38 : 32}
              />
            </div>
          ))}
          {/* "+N" кружок если участников больше maxAvatars */}
          {hiddenCount > 0 && (
            <div
              className="flex items-center justify-center rounded-full border-2 border-[var(--tg-card-bg)] bg-[var(--tg-link-color)] text-white font-semibold text-xs ml-1"
              style={{ width: 32, height: 32 }}
            >
              +{hiddenCount}
            </div>
          )}
        </div>
      </div>

      {/* Правая часть — заглушка под долги */}
      <div className="flex flex-col items-end min-w-[88px] ml-4">
        <span className="text-[var(--tg-hint-color)] text-xs font-medium">
          {t("debts_reserved")}
        </span>
      </div>
    </button>
  )
}

export default GroupCard
