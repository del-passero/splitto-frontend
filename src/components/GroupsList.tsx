// src/components/GroupsList.tsx

import { useEffect, useRef } from "react"
import GroupCard from "./GroupCard"
import CardSection from "./CardSection"
import type { GroupPreview } from "../types/group"
import { useGroupsStore } from "../store/groupsStore"
import { useUserStore } from "../store/userStore"
import { useNavigate } from "react-router-dom"

type Props = {
  groups: GroupPreview[]
}

const GroupsList = ({ groups }: Props) => {
  const navigate = useNavigate()
  // !!! ДОБАВЬ user !!!
  const { user } = useUserStore()
  // !!! ДОБАВЬ все нужные из стора !!!
  const { groupsHasMore, groupsLoading, loadMoreGroups } = useGroupsStore()
  const loaderRef = useRef<HTMLDivElement>(null)

  // --- ЭТОТ useEffect ОТВЕЧАЕТ ЗА ДОГРУЗКУ ---
  useEffect(() => {
    if (!groupsHasMore || groupsLoading || !loaderRef.current) return

    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && groupsHasMore && !groupsLoading) {
        if (user?.id) loadMoreGroups(user.id)
      }
    })

    observer.observe(loaderRef.current)
    // Clean up observer on unmount
    return () => observer.disconnect()
  }, [groupsHasMore, groupsLoading, user?.id, loadMoreGroups])

  // --- Рендер ---
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
      {/* Infinity scroll loader */}
      {groupsHasMore && <div ref={loaderRef} style={{ height: 1, width: "100%" }} />}
      {/* Показать текст если подгружается новая страница */}
      {groupsLoading && groups.length > 0 && (
        <div className="py-3 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
      )}
    </CardSection>
  )
}

export default GroupsList

// ------------- ПУТЬ К ФАЙЛУ -----------
// src/components/GroupsList.tsx
