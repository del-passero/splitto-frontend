// src/pages/GroupsPage.tsx

/**
 * Страница "Группы" — выводит список всех групп, где состоит пользователь.
 * Использует Zustand (useGroupsStore) для загрузки/хранения групп, а не прямой вызов API.
 * Шапка: секция-количество групп (только если есть группы).
 * Два блока через CardSection: FiltersRow (поиск/фильтр/сортировка) и GroupsList (карточки групп).
 * Если групп нет — EmptyGroups.
 * Всё только через i18n, цвета, отступы и стили строго Wallet/Telegram.
 */

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../store/userStore"
import { useGroupsStore } from "../store/groupsStore"
import CardSection from "../components/CardSection"
import GroupsList from "../components/GroupsList"
import FiltersRow from "../components/FiltersRow"
import EmptyGroups from "../components/EmptyGroups"
import SectionTitle from "../components/SectionTitle"

const GroupsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useUserStore(state => state.user)
  const {
    groups,
    groupsLoading,
    groupsError,
    fetchGroups,
  } = useGroupsStore()

  // Локальный стейт поиска (можно вынести в store если надо)
  const [search, setSearch] = useState("")

  // Загрузка групп при инициализации/смене пользователя
  useEffect(() => {
    if (user?.id) fetchGroups(user.id)
  }, [user?.id, fetchGroups])

  // Фильтрация по поиску (если нужно ещё фильтровать/сортировать — сюда)
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase())
  )

  // Если идёт загрузка — отображаем лоадер
  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-[var(--tg-hint-color)]">
        {t("loading")}
      </div>
    )
  }

  // Если нет групп — показываем EmptyGroups
  if (!groupsLoading && filteredGroups.length === 0) {
    return <EmptyGroups />
  }

  // Основной контент страницы — группы есть
  return (
    <div className="flex flex-col gap-3 w-full min-h-screen bg-[var(--tg-bg-color)] pb-6">
      {/* Заголовок-счётчик */}
      <SectionTitle>
        {t("groups_count_full", { count: filteredGroups.length })}
      </SectionTitle>

      {/* FiltersRow внутри CardSection */}
      <CardSection>
        <FiltersRow
          search={search}
          setSearch={setSearch}
          // если нужно — сюда можно добавить сортировку/фильтрацию
        />
      </CardSection>

      {/* Список карточек групп внутри CardSection */}
      <CardSection>
        <GroupsList
          groups={filteredGroups}
          onGroupClick={groupId => navigate(`/groups/${groupId}`)}
        />
      </CardSection>
    </div>
  )
}

export default GroupsPage
