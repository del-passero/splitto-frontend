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

// Новые модалки
import GroupsFilterModal from "../components/GroupsFilterModal"
import GroupsSortModal from "../components/GroupsSortModal"

type SortBy = "last_activity" | "name" | "created_at" | "members_count"
type SortDir = "asc" | "desc"

type FiltersState = {
  status: { active: boolean; archived: boolean; deleted: boolean; all: boolean }
  hidden: { hidden: boolean; visible: boolean; all: boolean }
  activity: { recent: boolean; inactive: boolean; empty: boolean; all: boolean }
}

const defaultFilters: FiltersState = {
  status: { active: true, archived: false, deleted: false, all: false },
  hidden: { hidden: false, visible: true, all: false },
  activity: { recent: false, inactive: false, empty: false, all: true },
}

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

  // Новое: состояние фильтра и сортировки
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [filters, setFilters] = useState<FiltersState>(defaultFilters)
  const [sortBy, setSortBy] = useState<SortBy>("last_activity")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // Производим серверные параметры из фильтров (только те, что поддерживаются бэком)
  const includeArchived = useMemo(() => {
    // Если включены архивные явно или выбран "ВСЕ" — просим бэк включить архив
    return filters.status.all || filters.status.archived
  }, [filters.status])

  const includeHidden = useMemo(() => {
    // Бэк умеет только "include_hidden=true/false", без раздельной фильтрации
    return filters.hidden.all || filters.hidden.hidden
  }, [filters.hidden])

  // Поисковая строка
  const q = useMemo(() => search.trim(), [search])

  // Первая загрузка и при смене параметров — как в ContactsPage
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
          loadMore={groupsHasMore ? () => {
            if (!user?.id) return
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
