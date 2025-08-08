// src/components/GroupsList.tsx

import { useEffect, useRef } from "react"
import GroupCard from "./GroupCard"
import CardSection from "./CardSection"
import { useGroupsStore } from "../store/groupsStore"
import { useNavigate } from "react-router-dom"

const PAGE_SIZE = 20

const GroupsList = () => {
  const {
    groups,
    groupsTotal,
    groupsLoading,
    groupsError,
    fetchGroups,
    groupsHasMore,
    groupsOffset,
    setGroupsOffset,
  } = useGroupsStore()
  const navigate = useNavigate()
  const loaderRef = useRef<HTMLDivElement>(null)

  // Сброс и загрузка первой страницы при монтировании (или по фильтрам)
  useEffect(() => {
    fetchGroups(0, PAGE_SIZE, { reset: true })
    setGroupsOffset(0)
    // eslint-disable-next-line
  }, [])

  // Infinity scroll
  useEffect(() => {
    if (groupsLoading || !groupsHasMore || !loaderRef.current) return

    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !groupsLoading && groupsHasMore) {
        const nextOffset = groupsOffset + PAGE_SIZE
        setGroupsOffset(nextOffset)
        fetchGroups(nextOffset, PAGE_SIZE)
      }
    })
    observer.observe(loaderRef.current)

    return () => observer.disconnect()
  }, [groupsLoading, groupsHasMore, groupsOffset, fetchGroups, setGroupsOffset])

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
        {groups.map((group, idx) => (
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
