// src/pages/GroupsPage.tsx

import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useGroupsStore } from "../store/groupsStore"
import { useUserStore } from "../store/userStore"
import CardSection from "../components/CardSection"
import EmptyGroups from "../components/EmptyGroups"
import GroupsList from "../components/GroupsList"
import FiltersRow from "../components/FiltersRow"

const GroupsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const { groups, groupsLoading, groupsError, fetchGroups } = useGroupsStore()
  const [search, setSearch] = useState("")

  // Запрос групп при первом рендере/смене пользователя
  useMemo(() => {
    if (user?.id) fetchGroups(user.id)
  }, [user?.id, fetchGroups])

  // Фильтрация по поиску
  const filteredGroups = useMemo(
    () =>
      groups.filter((group) =>
        group.name.toLowerCase().includes(search.toLowerCase())
      ),
    [groups, search]
  )

  return (
    <div className="min-h-screen w-full bg-[var(--tg-bg-color)] flex flex-col items-center pt-4 pb-8">
      {/* Строка статистики и количества групп */}
      {groups.length > 0 && (
        <div className="w-full max-w-md px-2 flex items-center justify-between mb-2">
          <span className="text-base font-medium text-[var(--tg-hint-color)]">
            {t("groups_activity", { count: filteredGroups.length })}
          </span>
        </div>
      )}

      {/* Блок фильтров и поиска */}
      {groups.length > 0 && (
        <CardSection className="mb-3">
          <FiltersRow search={search} setSearch={setSearch} />
        </CardSection>
      )}

      {/* Список групп или заглушка */}
      <CardSection>
        {groupsLoading && (
          <div className="text-center py-6 text-[var(--tg-hint-color)]">
            {t("loading")}
          </div>
        )}
        {groupsError && (
          <div className="text-center py-6 text-red-500">{groupsError}</div>
        )}
        {!groupsLoading && !groupsError && groups.length === 0 && (
          <EmptyGroups />
        )}
        {!groupsLoading && !groupsError && groups.length > 0 && (
          <GroupsList
            groups={filteredGroups}
            onGroupClick={(groupId) => navigate(`/groups/${groupId}`)}
          />
        )}
      </CardSection>
    </div>
  )
}

export default GroupsPage
