// src/components/GroupsList.tsx

/**
 * Отображает список групп в виде карточек (GroupCard).
 * Получает массив групп и onGroupClick (функция перехода на details).
 * Если список пуст — ничего не рендерит (EmptyGroups отображается на уровне страницы).
 */

import GroupCard from "./GroupCard"
import type { Group } from "../types/group"

type Props = {
  groups: Group[]                      // Список групп для отображения
  onGroupClick: (groupId: number) => void // Обработчик перехода на детали группы
  className?: string
}

const GroupsList = ({ groups, onGroupClick, className = "" }: Props) => {
  if (!groups.length) return null

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {groups.map(group => (
        <GroupCard
          key={group.id}
          group={group}
          onClick={() => onGroupClick(group.id)}
        />
      ))}
    </div>
  )
}

export default GroupsList
