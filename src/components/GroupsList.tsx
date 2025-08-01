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
          {/* Divider, как в SettingItem: отступы слева/справа */}
          {idx !== groups.length - 1 && (
            <div className="absolute left-5 right-5 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
          )}
        </div>
      ))}
    </CardSection>
  )
}
export default GroupsList