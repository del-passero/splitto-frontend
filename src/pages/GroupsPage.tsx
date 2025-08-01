// src/pages/GroupsPage.tsx

/**
 * Страница "Группы":
 * - FiltersRow (поиск/фильтр) — только если есть группы
 * - CardSection: TopInfoRow (информер о количестве групп) + GroupsList (карточки групп) — только если есть группы
 * - EmptyGroups — если групп нет (всё остальное скрыто)
 * Все надписи через i18n, стили строго Wallet-style.
 */

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useUserStore } from "../store/userStore"
import { useGroupsStore } from "../store/groupsStore"
import TopInfoRow from "../components/TopInfoRow"
import FiltersRow from "../components/FiltersRow"
import CardSection from "../components/CardSection"
import GroupsList from "../components/GroupsList"
import EmptyGroups from "../components/EmptyGroups"

const GroupsPage = () => {
  const { t } = useTranslation()
  const { user } = useUserStore()
  const {
    groups, groupsLoading, groupsError,
    fetchGroups
  } = useGroupsStore()
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (user?.id) fetchGroups(user.id)
  }, [user?.id, fetchGroups])

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase())
  )

  // Если нет групп — только заглушка
  if (!groupsLoading && !groupsError && groups.length === 0) {
    return (
      <div className="w-full min-h-screen flex flex-col bg-[var(--tg-bg-color)] pb-6">
        <EmptyGroups />
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--tg-bg-color)] pb-6">
      {/* FILTERS ROW — только если группы есть */}
      {!groupsLoading && !groupsError && filteredGroups.length > 0 && (
        <FiltersRow
          search={search}
          setSearch={setSearch}
        />
      )}

      {/* CardSection с заголовком Wallet-style и списком групп */}
      {!groupsLoading && !groupsError && filteredGroups.length > 0 && (
        <CardSection noPadding>
          <TopInfoRow count={filteredGroups.length} labelKey="groups_count" />
          <GroupsList groups={filteredGroups} />
        </CardSection>
      )}

      {/* Лоадер/ошибка — если надо */}
      {groupsLoading && (
        <CardSection>
          <div className="text-center py-6 text-[var(--tg-hint-color)]">{t("loading")}</div>
        </CardSection>
      )}
      {groupsError && (
        <CardSection>
          <div className="text-center py-6 text-red-500">{groupsError}</div>
        </CardSection>
      )}
    </div>
  )
}

export default GroupsPage
