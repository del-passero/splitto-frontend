// src/pages/GroupsPage.tsx
// Минимально совместимая страница групп с устойчивой дозагрузкой.
// - Не полагается на store.total / store.loading / offset/limit.
// - "Конец списка" определяем по факту добавления новых строк.
// - loadMore отключаем, когда больше ничего не приходит.

import { useEffect, useState } from "react"
import MainLayout from "../layouts/MainLayout"
import CardSection from "../components/CardSection"
import GroupsList from "../components/GroupsList"
import CreateGroupModal from "../components/CreateGroupModal"
import { useUserStore } from "../store/userStore"
import { useGroupsStore } from "../store/groupsStore"

const GroupsPage = () => {
  const { user } = useUserStore()
  const { groups, fetchGroups } = useGroupsStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  // Первичная загрузка/перезагрузка при смене пользователя
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      const before = useGroupsStore.getState().groups.length
      // reset:true — стор сам сбрасывает offset и грузит первую страницу
      await fetchGroups(user.id, { reset: true })
      if (cancelled) return

      const after = useGroupsStore.getState().groups.length
      // если что-то пришло — попробуем дозагружать; дальше onLoadMore сам выключит
      setHasMore(after > before)
      setLoading(false)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [user?.id, fetchGroups])

  // Дозагрузка следующей порции
  const onLoadMore = async () => {
    if (!user?.id) return
    if (loading || !hasMore) return

    setLoading(true)
    const before = useGroupsStore.getState().groups.length
    // без reset — стор должен подхватить следующий offset внутри себя
    await fetchGroups(user.id, {})
    const after = useGroupsStore.getState().groups.length

    // если ничего не добавилось — дальше грузить нечего
    if (after <= before) {
      setHasMore(false)
    }
    setLoading(false)
  }

  return (
    <MainLayout>
      {/* шапка попроще, без пропсов, чтобы не конфликтовать с твоими типами */}
      <CardSection>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Группы</h2>
          <span className="text-sm opacity-70">{groups.length}</span>
        </div>
      </CardSection>

      <GroupsList
        groups={groups as any}
        // важный момент: подаём loadMore только когда действительно есть что грузить
        loadMore={hasMore ? onLoadMore : undefined}
        loading={loading}
      />

      <CreateGroupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ownerId={user?.id || 0}
        onCreated={async () => {
          if (!user?.id) return
          setLoading(true)
          setHasMore(false)
          await fetchGroups(user.id, { reset: true })
          // после создания группы стор вернёт первую страницу;
          // включим попытку дозагрузки ровно один раз — дальше onLoadMore сам решит
          const len = useGroupsStore.getState().groups.length
          setHasMore(len > 0)
          setLoading(false)
        }}
      />
    </MainLayout>
  )
}

export default GroupsPage
