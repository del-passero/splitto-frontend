// src/pages/GroupsPage.tsx
// Поиск/фильтры/сорт — берём из стора. Любое изменение триггерит перезагрузку.

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
import CreateTransactionModal from "../components/transactions/CreateTransactionModal"

// Модалки
import GroupsFilterModal, { FiltersState as FiltersStateModal } from "../components/GroupsFilterModal"
import GroupsSortModal from "../components/GroupsSortModal"

type SortBy = "last_activity" | "name" | "created_at" | "members_count"
type SortDir = "asc" | "desc"

type FiltersState = FiltersStateModal

const GroupsPage = () => {
  const { t } = useTranslation()
  const { user } = useUserStore()

  const {
    groups, groupsLoading, groupsError,
    groupsHasMore, groupsTotal,
    fetchGroups, loadMoreGroups, clearGroups,

    includeHidden, includeArchived, includeDeleted,
    sortBy, sortDir, search,
    setFilters, setSort, setSearch,
  } = useGroupsStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)

  // модалки фильтров/сортировки (только "open" локально)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const q = useMemo(() => search.trim(), [search])

  const reload = (reset: boolean) => {
    if (!user?.id) return
    fetchGroups(user.id, {
      reset,
      q: q.length ? q : undefined,
      includeHidden,
      includeArchived,
      includeDeleted,
      sortBy,
      sortDir,
    })
  }

  // первичная загрузка и на все зависимости
  useEffect(() => {
    if (!user?.id) return
    clearGroups()
    reload(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, q, includeHidden, includeArchived, includeDeleted, sortBy, sortDir])

  const isSearching = q.length > 0
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
          onFilterClick={() => setFiltersOpen(true)}
          onSortClick={() => setSortOpen(true)}
        />
        <EmptyGroups notFound={notFound} />
        <CreateGroupModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          ownerId={user?.id || 0}
          onCreated={() => reload(true)}
        />
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

        {/* Фильтры / Сортировка */}
        <GroupsFilterModal
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          initial={{ includeArchived, includeDeleted, includeHidden }}
          onApply={(f: FiltersState) => {
            setFilters({
              includeArchived: f.includeArchived,
              includeDeleted: f.includeDeleted,
              includeHidden: f.includeHidden,
            })
          }}
        />
        <GroupsSortModal
          open={sortOpen}
          onClose={() => setSortOpen(false)}
          initial={{ sortBy, sortDir }}
          onApply={({ sortBy: sb, sortDir: sd }) => {
            setSort({ sortBy: sb, sortDir: sd })
          }}
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
        onFilterClick={() => setFiltersOpen(true)}
        onSortClick={() => setSortOpen(true)}
      />

      <CardSection noPadding>
        <TopInfoRow count={groupsTotal} labelKey="groups_count" />
        <GroupsList
          groups={groups as any}
          loading={groupsLoading}
          loadMore={
            groupsHasMore && !groupsLoading && user?.id
              ? () =>
                  loadMoreGroups(user!.id, {
                    q: q.length ? q : undefined,
                    includeHidden,
                    includeArchived,
                    includeDeleted,
                    sortBy,
                    sortDir,
                  })
              : undefined
          }
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
        onCreated={() => reload(true)}
      />
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

      {/* Фильтры / Сортировка */}
      <GroupsFilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        initial={{ includeArchived, includeDeleted, includeHidden }}
        onApply={(f: FiltersState) => {
          setFilters({
            includeArchived: f.includeArchived,
            includeDeleted: f.includeDeleted,
            includeHidden: f.includeHidden,
          })
        }}
      />
      <GroupsSortModal
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        initial={{ sortBy, sortDir }}
        onApply={({ sortBy: sb, sortDir: sd }) => {
          setSort({ sortBy: sb, sortDir: sd })
        }}
      />
    </MainLayout>
  )
}

export default GroupsPage
