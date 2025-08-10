// src/pages/GroupsPage.tsx
// Минимальные правки: первая загрузка (reset=true), пробрасываем searchQuery в GroupsList,
// счётчик в шапке считаем по отфильтрованным группам, как ты делал раньше.

import { useEffect, useMemo, useState } from "react"
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
    fetchGroups,
  } = useGroupsStore()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  // ВАЖНО: первая загрузка только при появлении user.id
  useEffect(() => {
    if (user?.id) {
      // полная перезагрузка списка с offset=0
      fetchGroups(user.id, { reset: true })
    }
  }, [user?.id, fetchGroups])

  // Счётчик в шапке — как раньше: по отфильтрованным группам
  const filteredCount = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups.length
    return groups.filter(g => (g.name ?? "").toLowerCase().includes(q)).length
  }, [groups, search])

  const isSearching = search.length > 0
  const noGroups = !filteredCount && !isSearching
  const notFound = !filteredCount && isSearching

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
      onClick: () => {},
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
          onCreated={() => user?.id && fetchGroups(user.id, { reset: true })}
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
        <TopInfoRow count={filteredCount} labelKey="groups_count" />
        {/* список сам ходит в стор и сам догружает страницы */}
        <GroupsList searchQuery={search} />
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
        onCreated={() => user?.id && fetchGroups(user.id, { reset: true })}
      />
    </MainLayout>
  )
}

export default GroupsPage
