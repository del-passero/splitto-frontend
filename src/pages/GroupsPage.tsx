// src/pages/GroupsPage.tsx

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../store/userStore"
import { useGroupsStore } from "../store/useGroupsStore"
import { useGroupMembersStore } from "../store/useGroupMembersStore"
import AddGroupModal from "../components/AddGroupModal"
import CardSection from "../components/CardSection"
import GroupCard from "../components/GroupCard"

/**
 * Страница "Группы":
 * - Список всех групп пользователя
 * - Кнопка "Добавить группу" (открывает AddGroupModal)
 * - Для каждой группы — карточка, переход по клику на просмотр группы
 */

const GroupsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useUserStore(state => state.user)
  const { groups, fetchGroups, loading } = useGroupsStore()
  const { fetchMembers, membersByGroup } = useGroupMembersStore()
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    if (user?.id) fetchGroups(user.id)
    // eslint-disable-next-line
  }, [user?.id])

  // При загрузке групп — подгружаем участников для карточек (до 1-2 групп для производительности)
  useEffect(() => {
    groups.slice(0, 5).forEach(g => {
      if (!membersByGroup[g.id]) fetchMembers(g.id)
    })
    // eslint-disable-next-line
  }, [groups])

  const handleGroupClick = (groupId: number) => {
    navigate(`/groups/${groupId}`)
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col items-center pt-6 pb-20 bg-[var(--tg-bg-color)]">
      <div className="w-full flex items-center justify-between mb-4 px-4">
        <div className="text-xl font-bold text-[var(--tg-text-color)]">{t("groups")}</div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          {t("add_group")}
        </button>
      </div>
      {loading && <div className="text-[var(--tg-hint-color)]">{t("loading")}</div>}
      {!loading && groups.length === 0 && (
        <div className="text-[var(--tg-hint-color)]">{t("no_groups")}</div>
      )}
      <div className="w-full px-2">
        {groups.map(group => (
          <CardSection key={group.id} className="cursor-pointer">
            <GroupCard
              group={group}
              members={membersByGroup[group.id] || []}
              onClick={() => handleGroupClick(group.id)}
            />
          </CardSection>
        ))}
      </div>
      <AddGroupModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        ownerId={user?.id || 0}
        onCreate={async () => {
          // После создания сразу обновим список
          if (user?.id) await fetchGroups(user.id)
        }}
      />
    </div>
  )
}

export default GroupsPage
