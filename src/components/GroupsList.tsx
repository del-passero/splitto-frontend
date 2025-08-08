// src/components/GroupsList.tsx

import { useEffect, useRef } from "react"
import GroupCard from "./GroupCard"
import { useGroupsStore } from "../store/groupsStore"
import { useUserStore } from "../store/userStore"

type Props = {
  groups: any[]
}

const GroupsList = ({ groups }: Props) => {
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
    <div>
      {groups.map((group, idx) => (
        <div key={group.id} className="relative">
          <GroupCard
            group={group}
            onClick={() => {}} // обязательно, даже если пустая функция
          />
          {idx !== groups.length - 1 && (
            <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
          )}
        </div>
      ))}
      {groupsHasMore && <div ref={loaderRef} style={{ height: 1, width: "100%" }} />}
    </div>
  )
}

export default GroupsList
