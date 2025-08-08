// src/components/GroupsList.tsx

import { useRef, useEffect } from "react"
import GroupCard from "./GroupCard"
import CardSection from "./CardSection"
import { useUserStore } from "../store/userStore"
import { useGroupsStore } from "../store/groupsStore"
import type { GroupPreview } from "../types/group"

type Props = {
  groups: GroupPreview[]
}

const GroupsList = ({ groups }: Props) => {
  const { user } = useUserStore()
  const {
    loadMoreGroups,
    groupsHasMore,
    groupsLoading,
    groupsError,
  } = useGroupsStore()
  const loaderRef = useRef<HTMLDivElement>(null)

  // Infinity scroll через IntersectionObserver
  useEffect(() => {
    if (!groupsHasMore || groupsLoading || !loaderRef.current) return

    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && groupsHasMore && !groupsLoading) {
        if (user?.id) loadMoreGroups(user.id)
      }
    })

    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [groupsHasMore, groupsLoading, user?.id, loadMoreGroups])

  return (
    <CardSection noPadding>
      <div className="grid grid-cols-1 gap-4">
        {groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            onClick={() => {
              // Навигация на страницу группы
              window.location.href = `/groups/${group.id}`
            }}
          />
        ))}
      </div>

      {/* Infinity scroll trigger */}
      {groupsHasMore && <div ref={loaderRef} style={{ height: 1, width: "100%" }} />}

      {/* Лоадер при дозагрузке */}
      {groupsLoading && groups.length > 0 && (
        <div className="py-3 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
      )}

      {/* Ошибка при загрузке */}
      {groupsError && (
        <div className="py-3 text-center text-red-500">{groupsError}</div>
      )}
    </CardSection>
  )
}

export default GroupsList
