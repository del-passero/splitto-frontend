// src/components/GroupsList.tsx
// Рендер и инфинити-скролл. Без “самоотключения” на нулевом приросте.
// Добавлено: контекстное меню карточки (⋮).

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
  hardDeleteGroup,
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

  // debts preview из стора
  const debtsPreview = useGroupsStore((s) => s.debtsPreviewByGroupId)
  const fetchDebtsPreview = useGroupsStore((s) => s.fetchDebtsPreview)

  // меню
  const { user } = useUserStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ x: number; y: number } | undefined>(undefined)
  const [menuCtx, setMenuCtx] = useState<{
    id: number
    name: string
    isOwner: boolean
    isArchived: boolean
    isDeleted: boolean
    isHidden: boolean
    hasDebts?: boolean
    hasTransactions?: boolean
  } | null>(null)

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

  // Открытие меню: собираем минимальный контекст (если есть дополнительные флаги — подставьте)
  const openMenu = useCallback((g: any, e?: MouseEvent) => {
    const ctx = {
      id: g.id,
      name: g.name,
      isOwner: user?.id === g.owner_id,
      isArchived: g.status === "archived",
      isDeleted: !!g.deleted_at,
      isHidden: !!g.is_hidden,        // если бек отдаёт персональную скрытость
      hasDebts: !!g.has_debts,        // если бек отдаёт этот флаг
      hasTransactions: !!g.has_tx,    // если бек отдаёт этот флаг
    }
    setMenuCtx(ctx)
    if (e) setAnchor({ x: (e as any).clientX, y: (e as any).clientY })
    else setAnchor(undefined)
    setMenuOpen(true)
  }, [user?.id])

  // Действия меню (минимальные, можно заменить на вашу логику с подтверждениями и обновлением стора)
  const handleEdit = (id: number) => {
    window.location.href = `/groups/${id}/edit`
  }

  const handleToggleHide = async (id: number, hide: boolean) => {
    try {
      hide ? await hideGroup(id) : await unhideGroup(id)
    } finally {
      setMenuOpen(false)
    }
  }

  const handleToggleArchive = async (id: number, toArchive: boolean) => {
    try {
      toArchive ? await archiveGroup(id) : await unarchiveGroup(id)
    } finally {
      setMenuOpen(false)
    }
  }

  const handleDeleteSoft = async (id: number) => {
    try {
      await softDeleteGroup(id)
    } finally {
      setMenuOpen(false)
    }
  }

  const handleDeleteHard = async (id: number) => {
    try {
      await hardDeleteGroup(id)
    } finally {
      setMenuOpen(false)
    }
  }

  const handleRestore = async (id: number, toActive: boolean) => {
    try {
      await restoreGroup(id, { toActive, returnFull: false })
    } finally {
      setMenuOpen(false)
    }
  }

  return (
    <CardSection noPadding>
      <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {groups.map((g) => (
          <GroupCard
            key={g.id}
            group={g as any}
            onClick={() => navigate(`/groups/${g.id}`)}
            onMenuClick={(id, e) => openMenu(g, e as any)}
            debts={debtsPreview[g.id]}
          />
        ))}
      </div>

      <div ref={loaderRef} aria-hidden style={{ height: 1, width: "100%", opacity: 0 }} />

      {/* Меню действий */}
      <GroupCardMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchor={anchor}
        context={menuCtx}
        onEdit={handleEdit}
        onToggleHide={handleToggleHide}
        onToggleArchive={handleToggleArchive}
        onDeleteSoft={handleDeleteSoft}
        onDeleteHard={handleDeleteHard}
        onRestore={handleRestore}
      />
    </CardSection>
  )
}

export default GroupsList
