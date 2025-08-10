// src/components/GroupsList.tsx
// ПОВЕДЕНИЕ КАК У ContactsList: сам берёт данные из стора, сам догружает страницы.
// Пропсы сведены к минимуму: только searchQuery для клиентской фильтрации.

import { useEffect, useMemo, useRef } from "react"
import CardSection from "./CardSection"
import GroupCard from "./GroupCard"
import { useGroupsStore } from "../store/groupsStore"
import { useUserStore } from "../store/userStore"

type Props = {
  searchQuery?: string
}

const GroupsList = ({ searchQuery = "" }: Props) => {
  const { user } = useUserStore()
  const {
    groups,
    groupsLoading,
    groupsHasMore,
    loadMoreGroups,
  } = useGroupsStore()

  const loaderRef = useRef<HTMLDivElement>(null)

  // Локальная фильтрация по названию (серверного поиска для групп нет)
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(g => (g.name ?? "").toLowerCase().includes(q))
  }, [groups, searchQuery])

  // Infinity scroll — ровно как в ContactsList, только без page/setPage:
  useEffect(() => {
    if (!loaderRef.current) return
    const node = loaderRef.current

    const observer = new window.IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return
      if (groupsLoading) return
      if (!groupsHasMore) return
      if (!user?.id) return
      // Догружаем следующую страницу
      loadMoreGroups(user.id)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [groupsLoading, groupsHasMore, loadMoreGroups, user?.id])

  // Пусто (и не грузится) — отдаём просто «пусто».
  if (!filtered.length && !groupsLoading) {
    return (
      <CardSection>
        <div className="py-12 text-center text-[var(--tg-hint-color)]">
          Ничего не найдено
        </div>
      </CardSection>
    )
  }

  // Первая загрузка — мягкий лоадер (если прям вообще пусто пока)
  if (groupsLoading && groups.length === 0) {
    return (
      <CardSection>
        <div className="py-12 text-center text-[var(--tg-hint-color)]">
          Загрузка...
        </div>
      </CardSection>
    )
  }

  return (
    <CardSection noPadding>
      <div className="grid grid-cols-1 gap-4">
        {filtered.map(group => (
          <GroupCard
            key={group.id}
            group={group as any} // GroupPreview совместим по полям, что нужны карточке
            onClick={() => (window.location.href = `/groups/${group.id}`)}
          />
        ))}
      </div>

      {/* якорь для IntersectionObserver */}
      {groupsHasMore && <div ref={loaderRef} style={{ height: 1, width: "100%" }} />}

      {/* нижний лоадер при дозагрузке */}
      {groupsLoading && filtered.length > 0 && (
        <div className="py-3 text-center text-[var(--tg-hint-color)]">
          Загрузка...
        </div>
      )}
    </CardSection>
  )
}

export default GroupsList
