// src/components/GroupsList.tsx
// Рендер и инфинити-скролл + превью долгов + корректное меню ⋮

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import CardSection from "./CardSection"
import GroupCard from "./GroupCard"
import GroupCardMenu from "./GroupCardMenu"
import type { GroupPreview } from "../types/group"
import { useGroupsStore } from "../store/groupsStore"
import { useUserStore } from "../store/userStore"
import {
  hideGroup,
  unhideGroup,
  archiveGroup,
  unarchiveGroup,
  softDeleteGroup,
  restoreGroup,
} from "../api/groupsApi"

type Props = {
  groups: GroupPreview[]
  loadMore?: () => Promise<unknown> | void
  loading?: boolean
}

const GroupsList = ({ groups, loadMore, loading = false }: Props) => {
  const navigate = useNavigate()
  const loaderRef = useRef<HTMLDivElement>(null)
  const ioRef = useRef<IntersectionObserver | null>(null)
  const lockRef = useRef(false)

  // user & store
  const { user } = useUserStore()
  const debtsPreview = useGroupsStore((s) => s.debtsPreviewByGroupId)
  const fetchDebtsPreview = useGroupsStore((s) => s.fetchDebtsPreview)
  const fetchGroups = useGroupsStore((s) => s.fetchGroups)
  const clearGroups = useGroupsStore((s) => s.clearGroups)

  // текущие параметры фильтров/сорт/поиска из стора
  const includeHidden   = useGroupsStore((s) => s.includeHidden)
  const includeArchived = useGroupsStore((s) => s.includeArchived)
  const includeDeleted  = useGroupsStore((s) => s.includeDeleted)
  const sortBy          = useGroupsStore((s) => s.sortBy)
  const sortDir         = useGroupsStore((s) => s.sortDir)
  const search          = useGroupsStore((s) => s.search)

  // локальный стейт меню
  const [menuOpenForId, setMenuOpenForId] = useState<number | null>(null)

  const visibleIds = useMemo(() => groups.map((g) => g.id), [groups])

  useEffect(() => {
    if (visibleIds.length > 0) {
      fetchDebtsPreview(visibleIds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds.join(",")])

  useEffect(() => {
    const el = loaderRef.current
    if (!el || !loadMore) return

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (!e.isIntersecting) return
        if (lockRef.current || loading) return

        lockRef.current = true
        const p = loadMore()
        const unlock = () => (lockRef.current = false)

        if (p && typeof (p as any).finally === "function") {
          ;(p as Promise<unknown>).finally(unlock)
        } else {
          setTimeout(unlock, 120)
        }
      },
      { root: null, rootMargin: "320px 0px 0px 0px", threshold: 0 }
    )

    io.observe(el)
    ioRef.current = io
    return () => {
      io.disconnect()
      if (ioRef.current === io) ioRef.current = null
    }
  }, [loadMore, loading])

  // рефреш с учётом текущих фильтров/сорт/поиска
  const refetch = useCallback(async () => {
    if (!user?.id) return
    clearGroups()
    await fetchGroups(user.id, {
      reset: true,
      q: search?.trim() || undefined,
      includeHidden,
      includeArchived,
      includeDeleted,
      sortBy,
      sortDir,
    })
  }, [user?.id, clearGroups, fetchGroups, search, includeHidden, includeArchived, includeDeleted, sortBy, sortDir])

  const currentGroup = useMemo(
    () => groups.find((g) => g.id === menuOpenForId),
    [groups, menuOpenForId]
  )

  const isOwner = useMemo(() => {
    if (!currentGroup || !user?.id) return false
    return (currentGroup as any).owner_id === user.id
  }, [currentGroup, user?.id])

  const isArchived = (currentGroup as any)?.status === "archived"
  const isDeleted  = !!(currentGroup as any)?.deleted_at
  const isHiddenForMe = !!(currentGroup as any)?.is_hidden

  // handlers
  const onEdit = useCallback(async () => {
    if (!currentGroup) return
    navigate(`/groups/${currentGroup.id}/settings`)
  }, [currentGroup, navigate])

  const onHide = useCallback(async () => {
    if (!currentGroup) return
    await hideGroup(currentGroup.id)
    await refetch()
  }, [currentGroup, refetch])

  const onUnhide = useCallback(async () => {
    if (!currentGroup) return
    await unhideGroup(currentGroup.id)
    await refetch()
  }, [currentGroup, refetch])

  const onArchive = useCallback(async () => {
    if (!currentGroup) return
    await archiveGroup(currentGroup.id)
    await refetch()
  }, [currentGroup, refetch])

  const onUnarchive = useCallback(async () => {
    if (!currentGroup) return
    await unarchiveGroup(currentGroup.id, true)
    await refetch()
  }, [currentGroup, refetch])

  const onSoftDelete = useCallback(async () => {
    if (!currentGroup) return
    await softDeleteGroup(currentGroup.id) // бэкенд сам решает soft/hard
    await refetch()
  }, [currentGroup, refetch])

  const onRestore = useCallback(async (_opts?: { toActive?: boolean }) => {
    if (!currentGroup) return
    await restoreGroup(currentGroup.id, {
      toActive: true,       // всегда в active
      returnFull: false,
    })
    await refetch()
  }, [currentGroup, refetch])

  return (
    <CardSection noPadding>
      <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {groups.map((g) => (
          <GroupCard
            key={g.id}
            group={g as any}
            onClick={() => navigate(`/groups/${g.id}`)}
            onMenuClick={(id) => setMenuOpenForId(id)}
            debts={debtsPreview[g.id]}
          />
        ))}
      </div>
      <div ref={loaderRef} aria-hidden style={{ height: 1, width: "100%", opacity: 0 }} />

      {/* Меню карточки */}
      <GroupCardMenu
        open={menuOpenForId != null}
        onClose={() => setMenuOpenForId(null)}
        isOwner={!!isOwner}
        isArchived={!!isArchived}
        isDeleted={!!isDeleted}
        isHiddenForMe={!!isHiddenForMe}
        onEdit={onEdit}
        onHide={onHide}
        onUnhide={onUnhide}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        onSoftDelete={onSoftDelete}  // ← единая кнопка «Удалить»
        onRestore={onRestore}
      />
    </CardSection>
  )
}

export default GroupsList
