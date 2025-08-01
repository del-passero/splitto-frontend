// src/components/GroupsList.tsx

import GroupCard from "./GroupCard"
import type { Group } from "../types/group"

type Props = {
  groups: Group[]
  onGroupClick: (groupId: number) => void
}

const GroupsList = ({ groups, onGroupClick }: Props) => {
  if (!groups || groups.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => (
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
