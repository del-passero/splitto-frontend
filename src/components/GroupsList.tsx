// src/components/GroupsList.tsx

import GroupCard from "./GroupCard"
import CardSection from "./CardSection"
import type { Group } from "../types/group"
import { useNavigate } from "react-router-dom"

type Props = { groups: Group[] }

const GroupsList = ({ groups }: Props) => {
  const navigate = useNavigate()
  return (
    <CardSection noPadding>
      {groups.map((group, idx) => (
        <div key={group.id} className="relative">
          <GroupCard
            group={group}
            onClick={() => navigate(`/groups/${group.id}`)}
          />
          {/* Divider — с чуть меньшим отступом слева (например, после аватара + 8px) */}
          {idx !== groups.length - 1 && (
            <div className="absolute left-20 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
          )}
        </div>
      ))}
    </CardSection>
  )
}
export default GroupsList
