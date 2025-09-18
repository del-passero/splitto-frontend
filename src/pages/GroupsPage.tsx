// src/pages/GroupsPage.tsx
// Как ContactsPage: поиск уходит на сервер, счётчик берём из total, инфинити-скролл через GroupsList.loadMore

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

// Новые модалки (и типы — используем их же, чтобы не было конфликтов)
import GroupsFilterModal, {
  FiltersState as GroupsFilterState,
} from "../components/GroupsFilterModal"
import GroupsSortModal, {
  SortBy,
  SortDir,
} from "../components/GroupsSortModal"

const defaultFilters: GroupsFilterState = {
  includeArchived: false,
  includeHidden: false,
}

const GroupsPage = () => {
  const { t } = useTranslation()
  const { user } = useUserStore()
  const {
    groups,
    groupsLoading,
    groupsError,
    groupsHasMore,
    groupsTotal,
    fetchGroups,
    loadMoreGroups,
    clearGroups,
  } = useGroupsStore()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)

  // Фильтр/сортировка
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [filters, setFilters] = useState<GroupsFilterState>(defaultFilters)
  const [sortBy, setSortBy] = useState<SortBy>("last_activity")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // Производные серверные параметры
  const includeArchived = filters.includeArchived
  const includeHidden = filters.includeHidden

  // Поисковая строка
  const q = useMemo(() => search.trim(), [search])

  // Первая загрузка и при изменении параметров
  useEffect(() => {
    if (!user?.id) return
    clearGroups()
    fetchGroups(user.id, {
      reset: true,
      q: q.length ? q : undefined,
      includeHidden,
      includeArchived,
      sortBy,
      sortDir,
    })
    // eslint-disable-next-line
  }, [user?.id, q, includeHidden, includeArchived, sortBy, sortDir])

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
          onCreated={() =>
            user?.id &&
            fetchGroups(user.id, {
              reset: true,
              q: search.trim() || undefined,
              includeHidden,
              includeArchived,
              sortBy,
              sortDir,
            })
          }
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

        {/* Новые модалки */}
        <GroupsFilterModal
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          initial={filters}
          onApply={(f) => setFilters(f)}
        />
        <GroupsSortModal
          open={sortOpen}
          onClose={() => setSortOpen(false)}
          initial={{ sortBy, sortDir }}
          onApply={({ sortBy: sb, sortDir: sd }) => {
            setSortBy(sb)
            setSortDir(sd)
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
        {/* ВАЖНО: считаем по total, а не по длине текущей страницы */}
        <TopInfoRow count={groupsTotal} labelKey="groups_count" />
        <GroupsList
          groups={groups}
          loading={groupsLoading}
          loadMore={
            groupsHasMore
              ? () => {
                  if (!user?.id) return
                  // Пагинация: в сторе loadMoreGroups сейчас умеет только q,
                  // фильтры и сортировка зашиты в текущем серверном окне
                  loadMoreGroups(user.id, q.length ? q : undefined)
                }
              : undefined
          }
        />
      </CardSection>

      {groupsLoading && (
        <CardSection>
          <div className="text-center py-6 text-[var(--tg-hint-color)]">
            {t("loading")}
          </div>
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
        onCreated={() =>
          user?.id &&
          fetchGroups(user.id, {
            reset: true,
            q: search.trim() || undefined,
            includeHidden,
            includeArchived,
            sortBy,
            sortDir,
          })
        }
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

      {/* Новые модалки */}
      <GroupsFilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        initial={filters}
        onApply={(f) => setFilters(f)}
      />
      <GroupsSortModal
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        initial={{ sortBy, sortDir }}
        onApply={({ sortBy: sb, sortDir: sd }) => {
          setSortBy(sb)
          setSortDir(sd)
        }}
      />
    </MainLayout>
  )
}

export default GroupsPage
