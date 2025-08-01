// src/pages/GroupsPage.tsx

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

  const isSearching = search.length > 0
  const noGroups = !filteredGroups.length && !isSearching
  const notFound = !filteredGroups.length && isSearching

  if (!groupsLoading && !groupsError && (noGroups || notFound)) {
    return (
      <div className="w-full min-h-screen flex flex-col bg-[var(--tg-bg-color)] pb-6">
        <FiltersRow
          search={search}
          setSearch={setSearch}
          placeholderKey="search_group_placeholder"
        />
        <EmptyGroups notFound={notFound} />
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--tg-bg-color)] pb-6">
      <FiltersRow
        search={search}
        setSearch={setSearch}
        placeholderKey="search_group_placeholder"
      />

      <CardSection noPadding>
        <TopInfoRow count={filteredGroups.length} labelKey="groups_count" />
        <GroupsList groups={filteredGroups} />
      </CardSection>

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
