// src/components/GroupsList.tsx

import { useEffect, useRef } from "react"
import GroupCard from "./GroupCard"
import CardSection from "./CardSection"
import { useGroupsStore } from "../store/groupsStore"
import { useUserStore } from "../store/userStore"
import { useNavigate } from "react-router-dom"

const PAGE_SIZE = 20

const GroupsList = () => {
  const {
    groups,
    groupsTotal,
    groupsOffset,
    groupsHasMore,
    groupsLoading,
    groupsError,
    fetchGroups,
    loadMoreGroups,
  } = useGroupsStore()
  const { user } = useUserStore()
  const navigate = useNavigate()
  const loaderRef = useRef<HTMLDivElement>(null)

  // При маунте — загрузить первую страницу
  useEffect(() => {
    if (user?.id) fetchGroups(user.id, { reset: true })
    // eslint-disable-next-line
  }, [user?.id])

  // Infinity scroll
  useEffect(() => {
    if (groupsLoading || !groupsHasMore || !loaderRef.current) return

    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !groupsLoading && groupsHasMore && user?.id) {
        loadMoreGroups(user.id)
      }
    })
    observer.observe(loaderRef.current)

    return () => observer.disconnect()
  }, [groupsLoading, groupsHasMore, user?.id, loadMoreGroups])

  // Ошибка
  if (groupsError) {
    return (
      <CardSection>
        <div className="py-12 text-center text-red-500">{groupsError}</div>
      </CardSection>
    )
  }

  // Лоадер при первой загрузке
  if (groupsLoading && groups.length === 0) {
    return (
      <CardSection>
        <div className="py-12 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
      </CardSection>
    )
  }

  // Основной список
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
        <div ref={loaderRef} style={{ height: 1, width: "100%" }} />
      )}
      {groupsLoading && groups.length > 0 && (
        <div className="py-3 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
      )}
    </CardSection>
  )
}

export default GroupsList
