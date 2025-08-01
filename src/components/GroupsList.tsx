// src/components/GroupsList.tsx

import GroupCard from "./GroupCard"
import type { Group } from "../types/group"
import { useNavigate } from "react-router-dom"

type Props = {
  groups: Group[]
}

const GroupsList = ({ groups }: Props) => {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col bg-[var(--tg-bg-color)]">
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
