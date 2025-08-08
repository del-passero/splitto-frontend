// src/components/GroupsList.tsx

import { useEffect, useRef } from "react"
import GroupCard from "./GroupCard"
import CardSection from "./CardSection"
import type { GroupPreview } from "../types/group"
import { useNavigate } from "react-router-dom"
import { useGroupsStore } from "../store/groupsStore"
import { useUserStore } from "../store/userStore"

// Важно: используем GroupPreview!
type Props = { groups: GroupPreview[] }

const GroupsList = ({ groups }: Props) => {
  const navigate = useNavigate()
  const { groupsHasMore, groupsLoading, loadMoreGroups } = useGroupsStore()
  const { user } = useUserStore()
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loaderRef.current || !user?.id) return
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !groupsLoading && groupsHasMore) {
        loadMoreGroups(user.id)
      }
    })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [groupsLoading, groupsHasMore, user?.id])

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
      {groupsHasMore && (
        <div ref={loaderRef} style={{ height: 8, width: "100%" }} />
      )}
    </CardSection>
  )
}

export default GroupsList
