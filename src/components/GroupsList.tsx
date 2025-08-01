// src/components/GroupsList.tsx

/**
 * Отображает список групп в виде карточек (GroupCard).
 * Получает массив групп и функцию onGroupClick (переход на details).
 * Если список пуст — ничего не рендерит (EmptyGroups отображается на уровне страницы).
 * Все стили строго по твоим правилам. Карточки — кликабельные.
 */

import GroupCard from "./GroupCard"
import type { Group } from "../types/group"

type Props = {
  groups: Group[]                            // Список групп для отображения
  onGroupClick: (groupId: number) => void    // Обработчик перехода на details
  className?: string                         // Дополнительные стили
}

const GroupsList = ({ groups, onGroupClick, className = "" }: Props) => {
  // Если групп нет — ничего не рендерим (заглушка выше по дереву)
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
