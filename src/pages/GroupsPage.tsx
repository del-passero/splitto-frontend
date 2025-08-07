// src/pages/GroupsPage.tsx

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import MainLayout from "../layouts/MainLayout"
import { Users, HandCoins } from "lucide-react"
import { useUserStore } from "../store/userStore"
import { useGroupsStore } from "../store/groupsStore"
import TopInfoRow from "../components/TopInfoRow"
import FiltersRow from "../components/FiltersRow"
import CardSection from "../components/CardSection"
import GroupsList from "../components/GroupsList"
import EmptyGroups from "../components/EmptyGroups"
import CreateGroupModal from "../components/CreateGroupModal"

const GroupsPage = () => {
  const { t } = useTranslation()
  const { user } = useUserStore()
  const {
    groups, groupsLoading, groupsError,
    fetchGroups
  } = useGroupsStore()
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (user?.id) fetchGroups(user.id)
  }, [user?.id, fetchGroups])

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase())
  )

  const isSearching = search.length > 0
  const noGroups = !filteredGroups.length && !isSearching
  const notFound = !filteredGroups.length && isSearching

  const fabActions = [
    {
      key: "add-group",
      icon: <Users size={28} strokeWidth={1.5} />,
      onClick: () => setModalOpen(true),
      ariaLabel: t("create_group"),
      label: t("create_group"),
    },
    {
      key: "add-transaction",
      icon: <HandCoins size={28} strokeWidth={1.5} />,
      onClick: () => {}, // handle add transaction modal
      ariaLabel: t("add_transaction"),
      label: t("add_transaction"),
    },
  ]

  if (!groupsLoading && !groupsError && (noGroups || notFound)) {
    return (
      <MainLayout fabActions={fabActions}>
        <FiltersRow
          search={search}
          setSearch={setSearch}
          placeholderKey="search_group_placeholder"
        />
        <EmptyGroups notFound={notFound} />
        <CreateGroupModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          ownerId={user?.id || 0}
          onCreated={() => user?.id && fetchGroups(user.id)}
        />
      </MainLayout>
    )
  }

  return (
    <MainLayout fabActions={fabActions}>
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
      <CreateGroupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ownerId={user?.id || 0}
        onCreated={() => user?.id && fetchGroups(user.id)}
      />
    </MainLayout>
  )
}

export default GroupsPage
