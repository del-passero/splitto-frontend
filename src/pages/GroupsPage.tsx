// src/pages/GroupsPage.tsx

/**
 * Страница "Группы" — отображает список всех групп, где состоит пользователь.
 * Вверху: строка с количеством групп, FiltersRow (фильтр/поиск/сорт).
 * Ниже — CardSection с карточками групп.
 * Если нет групп — компонент EmptyGroups.
 */

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import CardSection from "../components/CardSection"
import FiltersRow from "../components/FiltersRow"
import GroupsList from "../components/GroupsList"
import EmptyGroups from "../components/EmptyGroups"
import { useGroupsStore } from "../store/groupsStore"
import { useUserStore } from "../store/userStore"

const GroupsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const { user } = useUserStore()              // Текущий пользователь
  const {
    groups, groupsLoading, groupsError,
    fetchGroups
  } = useGroupsStore()

  // Загружаем группы пользователя при первом рендере/смене пользователя
  useEffect(() => {
    if (user?.id) fetchGroups(user.id)
  }, [user?.id, fetchGroups])

  // Фильтрация групп по названию
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase())
  )

  const hasGroups = filteredGroups.length > 0

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--tg-bg-color)] pb-6">
      {/* Строка с количеством групп — только если группы есть */}
      {hasGroups && (
        <div className="flex items-center px-4 pt-6 pb-2">
          <span className="text-xl font-bold text-[var(--tg-text-color)]">
            {t("groups")}
          </span>
          <span className="ml-2 text-sm text-[var(--tg-hint-color)] font-medium">
            {t("groups_count", { count: filteredGroups.length })}
          </span>
        </div>
      )}

      {/* FiltersRow — только если есть группы */}
      {hasGroups && (
        <CardSection className="mb-2">
          <FiltersRow
            value={search}
            onChange={setSearch}
            onFilterClick={() => { /* Заглушка фильтра */ }}
            onSortClick={() => { /* Заглушка сортировки */ }}
            placeholder={t("search_group_placeholder")}
          />
        </CardSection>
      )}

      {/* Основная секция со списком групп или заглушкой */}
      <CardSection>
        {groupsLoading && (
          <div className="text-center py-6 text-[var(--tg-hint-color)]">{t("loading")}</div>
        )}
        {groupsError && (
          <div className="text-center py-6 text-red-500">{groupsError}</div>
        )}
        {!groupsLoading && !groupsError && !hasGroups && (
          <EmptyGroups />
        )}
        {/* Список карточек групп */}
        {hasGroups && (
          <GroupsList
            groups={filteredGroups}
            onGroupClick={group => navigate(`/groups/${group.id}`)}
          />
        )}
      </CardSection>
    </div>
  )
}

export default GroupsPage
