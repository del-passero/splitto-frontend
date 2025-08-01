// src/components/GroupsList.tsx

/**
 * Список карточек групп. При клике — переход на страницу группы.
 * Использует GroupCard и передаёт group + обработчик.
 */

import GroupCard from "./GroupCard"
import type { Group } from "../types/group"
import { useNavigate } from "react-router-dom"

type Props = {
  groups: Group[]
}

const GroupsList = ({ groups }: Props) => {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-2 px-1 pb-4">
      {groups.map(group => (
        <GroupCard
          key={group.id}
          group={group}
          onClick={() => navigate(`/groups/${group.id}`)}
        />
      ))}
    </div>
  )
}

export default GroupsList
