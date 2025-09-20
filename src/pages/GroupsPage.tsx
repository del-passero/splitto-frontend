// src/pages/GroupsPage.tsx
// Поиск — на сервер, счётчик — из total, infinity-scroll через GroupsList.loadMore

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
import GroupsFilterModal, { FiltersState as ModalFiltersState } from "../components/GroupsFilterModal"
import GroupsSortModal from "../components/GroupsSortModal"

type SortBy = "last_activity" | "name" | "created_at" | "members_count"
type SortDir = "asc" | "desc"
type FiltersState = ModalFiltersState

const defaultFilters: FiltersState = {
  status: { active: true, archived: false, deleted: false },
  hidden: { visible: true, hidden: false },
  activity: { recent: false, inactive: false, empty: false },
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

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [filters, setFilters] = useState<FiltersState>(defaultFilters)
  const [sortBy, setSortBy] = useState<SortBy>("last_activity")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // Флаги, которые понимает сервер
  const includeArchived = filters.status.archived
  const includeDeleted = filters.status.deleted
  const includeHidden = filters.hidden.hidden

  const q = useMemo(() => search.trim(), [search])

  const loadPage = (reset: boolean) => {
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

  useEffect(() => {
    if (!user?.id) return
    clearGroups()
    loadPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, q, includeHidden, includeArchived, includeDeleted, sortBy, sortDir])

  // Клиентская фильтрация: статус/скрытые/активность
  const filteredGroups = useMemo(() => {
    let arr = groups as any[]

    // Статус (любой набор комбинаций)
    const s = filters.status
    const statusAny = s.active || s.archived || s.deleted
    if (statusAny) {
      arr = arr.filter((g) => {
        const deleted = !!g.deleted_at
        const st = g.status
        return (s.deleted && deleted) || (s.active && !deleted && st === "active") || (s.archived && !deleted && st === "archived")
      })
    }

    // Скрытые/видимые (любой набор)
    const h = filters.hidden
    const hiddenAny = h.visible || h.hidden
    if (hiddenAny) {
      arr = arr.filter((g) => {
        const hidden = !!(g.is_hidden || g.is_hidden_for_me || g.hidden_for_me)
        return (h.hidden && hidden) || (h.visible && !hidden)
      })
    }

    // Активность (пороговые значения UI-уровня)
    const a = filters.activity
    const activityAny = a.recent || a.inactive || a.empty
    if (activityAny) {
      const now = Date.now()
      const day = 24 * 60 * 60 * 1000
      const RECENT_DAYS = 7
      const INACTIVE_DAYS = 30
      arr = arr.filter((g) => {
        const val = g.last_activity_at
        const ts = val ? new Date(val).getTime() : NaN
        const empty = !val
        const recent = !!val && now - ts <= RECENT_DAYS * day
        const inactive = !!val && now - ts >= INACTIVE_DAYS * day
        return (a.empty && empty) || (a.recent && recent) || (a.inactive && inactive)
      })
    }

    return arr
  }, [groups, filters])

  const isSearching = q.length > 0
  const nothingLoaded = !groupsLoading && !groupsError && filteredGroups.length === 0
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
          onCreated={() => loadPage(true)}
        />
        <CreateTransactionModal
          open={createTxOpen}
          onOpenChange={setCreateTxOpen}
          groups={(filteredGroups ?? []).map((g: any) => ({
            id: g.id,
            name: g.name,
            icon: g.icon,
            color: g.color,
          }))}
        />

        <GroupsFilterModal
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          initial={filters}
          onApply={setFilters}
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
        <TopInfoRow count={groupsTotal} labelKey="groups_count" />
        <GroupsList
          groups={filteredGroups as any}
          loading={groupsLoading}
          loadMore={
            groupsLoading || !user?.id
              ? undefined
              : () => {
                  return loadMoreGroups(user!.id, {
                    q: q.length ? q : undefined,
                    includeHidden,
                    includeArchived,
                    includeDeleted,
                    sortBy,
                    sortDir,
                  })
                }
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
        onCreated={() => loadPage(true)}
      />
      <CreateTransactionModal
        open={createTxOpen}
        onOpenChange={setCreateTxOpen}
        groups={(filteredGroups ?? []).map((g: any) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          color: g.color,
        }))}
      />

      <GroupsFilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        initial={filters}
        onApply={setFilters}
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
