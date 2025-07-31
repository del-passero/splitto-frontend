// src/pages/GroupsPage.tsx

/**
 * Страница "Группы" — отображает список всех групп, где состоит пользователь.
 * Вверху: заголовок, поиск, фильтр, сортировка.
 * Внутри CardSection — список GroupCard.
 * При клике на карточку — переход на страницу отдельной группы.
 * Все подписи через i18n, цвета и стили — строго в твоём стиле.
 * Используются только твои готовые компоненты: SearchBar, SortButton, FilterButton, CardSection.
 */

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import CardSection from "../components/CardSection"
import SearchBar from "../components/SearchBar"
import SortButton from "../components/SortButton"
import FilterButton from "../components/FilterButton"
import GroupCard from "../components/GroupCard"
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

  // Поиск по названию группы
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--tg-bg-color)] pb-6">
      {/* Шапка страницы */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold text-[var(--tg-text-color)]">
          {t("groups")}
        </h1>
        {/* Можно добавить подсчёт групп: */}
        <span className="ml-2 text-sm text-[var(--tg-hint-color)] font-medium">
          {filteredGroups.length > 0 && t("groups_count", { count: filteredGroups.length })}
        </span>
      </header>

      {/* Панель поиска и фильтров */}
      <div className="flex items-center gap-2 mb-4 px-4">
        <FilterButton onClick={() => { /* Заглушка для фильтра */ }} />
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={t("search_group_placeholder") || ""}
          />
        </div>
        <SortButton onClick={() => { /* Заглушка для сортировки */ }} />
      </div>

      {/* Основная секция со списком групп */}
      <CardSection>
        {/* Лоадер/ошибка/пусто */}
        {groupsLoading && (
          <div className="text-center py-6 text-[var(--tg-hint-color)]">{t("loading")}</div>
        )}
        {groupsError && (
          <div className="text-center py-6 text-red-500">{groupsError}</div>
        )}
        {!groupsLoading && !groupsError && filteredGroups.length === 0 && (
          <div className="text-center py-6 text-[var(--tg-hint-color)]">{t("empty_groups")}</div>
        )}

        {/* Список карточек групп */}
        <div className="flex flex-col gap-2">
          {filteredGroups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              onClick={() => navigate(`/groups/${group.id}`)}
            />
          ))}
        </div>
      </CardSection>
    </div>
  )
}

export default GroupsPage
