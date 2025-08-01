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
      {groups.map((group, index) => (
        <div key={group.id} className="relative">
          <GroupCard
            group={group}
            onClick={() => navigate(`/groups/${group.id}`)}
          />
          {/* Разделитель, начинающийся после аватара */}
          {index !== groups.length - 1 && (
            <div className="absolute bottom-0 left-[72px] right-0 border-b border-[var(--tg-secondary-bg-color)]" />
          )}
        </div>
      ))}
    </div>
  )
}

export default GroupsList
