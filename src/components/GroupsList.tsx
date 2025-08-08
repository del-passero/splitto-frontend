import GroupCard from "./GroupCard"
import CardSection from "./CardSection"
import { useNavigate } from "react-router-dom"
import type { Group, GroupPreview } from "../types/group"


type Props = {
  groups: (Group | GroupPreview)[]
}

const GroupsList = ({ groups }: Props) => {
  const navigate = useNavigate()
  return (
    <CardSection noPadding>
      <div className="grid grid-cols-1 gap-4">
        {groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            onClick={() => navigate(`/groups/${group.id}`)}
          />
        ))}
      </div>
    </CardSection>
  )
}

export default GroupsList
