// src/components/GroupCard.tsx

import GroupAvatar from "./GroupAvatar"
import Avatar from "./Avatar"
import type { Group, GroupUser } from "../types/group"

type Props = {
  group: Group
  members: GroupUser[]
  onClick?: () => void
}

/**
 * Карточка группы в списке групп.
 * - Аватар группы (скругленный квадрат)
 * - Название, до 3 аватарок участников, надпись "и еще N"
 * - По клику вызывает onClick (например, переход на страницу группы)
 */
const GroupCard = ({ group, members, onClick }: Props) => {
  const shownMembers = members.slice(0, 3)
  const moreCount = members.length > 3 ? members.length - 3 : 0

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-[var(--tg-card-bg)] hover:bg-[var(--tg-secondary-bg)] cursor-pointer shadow-sm transition"
      onClick={onClick}
    >
      <GroupAvatar name={group.name} size={48} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-base text-[var(--tg-text-color)] truncate">
          {group.name}
        </div>
        <div className="flex items-center mt-1 gap-1">
          {shownMembers.map(user => (
            <Avatar key={user.id} name={user.name} src={user.photo_url} size={24} />
          ))}
          {moreCount > 0 && (
            <span className="ml-1 text-xs text-[var(--tg-hint-color)]">
              {`+${moreCount}`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupCard
