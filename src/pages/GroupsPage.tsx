// src/pages/GroupsPage.tsx
// Как ContactsPage: поиск уходит на сервер, счётчик берём из total, инфинити-скролл через GroupsList.loadMore

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
import CreateTransactionModal from "../components/transactions/CreateTransactionModal"

const GroupsPage = () => {
  const { t } = useTranslation()
  const { user } = useUserStore()
  const {
    groups, groupsLoading, groupsError,
    groupsHasMore, groupsTotal,
    fetchGroups, loadMoreGroups, clearGroups
  } = useGroupsStore()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)

  // Первая загрузка и при смене user/search — как в ContactsPage
  useEffect(() => {
    if (!user?.id) return
    clearGroups()
    const q = search.trim()
    fetchGroups(user.id, { reset: true, q: q.length ? q : undefined })
    // eslint-disable-next-line
  }, [user?.id, search])

  const isSearching = search.trim().length > 0
  const nothingLoaded = !groupsLoading && !groupsError && groups.length === 0
  const notFound = isSearching && nothingLoaded
  const noGroups = !isSearching && nothingLoaded

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
      onClick: () => setCreateTxOpen(true),
      ariaLabel: t("add_transaction"),
      label: t("add_transaction"),
    },
  ]

  if (noGroups || notFound) {
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
          onCreated={() => user?.id && fetchGroups(user.id, { reset: true, q: search.trim() || undefined })}
        />
        {/* Модалка создания транзакции (общая) */}
        <CreateTransactionModal
          open={createTxOpen}
          onOpenChange={setCreateTxOpen}
          groups={(groups ?? []).map((g: any) => ({
            id: g.id,
            name: g.name,
            icon: g.icon,
            color: g.color,
          }))}
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
        {/* ВАЖНО: считаем по total, а не по длине текущей страницы */}
        <TopInfoRow count={groupsTotal} labelKey="groups_count" />
        <GroupsList
          groups={groups}
          loading={groupsLoading}
          loadMore={groupsHasMore ? () => {
            if (!user?.id) return
            const q = search.trim()
            loadMoreGroups(user.id, q.length ? q : undefined)
          } : undefined}
        />
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
        onCreated={() => user?.id && fetchGroups(user.id, { reset: true, q: search.trim() || undefined })}
      />

      {/* Модалка создания транзакции (общая) */}
      <CreateTransactionModal
        open={createTxOpen}
        onOpenChange={setCreateTxOpen}
        groups={(groups ?? []).map((g: any) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          color: g.color,
        }))}
      />
    </MainLayout>
  )
}

export default GroupsPage
