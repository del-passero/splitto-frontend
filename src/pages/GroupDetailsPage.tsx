// src/pages/GroupDetailsPage.tsx
import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { getGroupDetails } from "../api/groupsApi"
import { getGroupMembers } from "../api/groupMembersApi"
import { useUserStore } from "../store/userStore"

import type { Group } from "../types/group"
import type { GroupMember } from "../types/group_member"

import GroupHeader from "../components/group/GroupHeader"
import ParticipantsScroller from "../components/group/ParticipantsScroller"
import GroupTabs from "../components/group/GroupTabs"
import GroupTransactionsTab from "../components/group/GroupTransactionsTab"
import GroupBalanceTab from "../components/group/GroupBalanceTab"
import GroupAnalyticsTab from "../components/group/GroupAnalyticsTab"
import AddGroupMembersModal from "../components/group/AddGroupMembersModal"
import CreateTransactionModal from "../components/transactions/CreateTransactionModal"
import InviteGroupModal from "../components/group/InviteGroupModal"

// лёгкая модалка контакта
import ContactQuickModal from "../components/contacts/ContactQuickModal"

const PAGE_SIZE = 24

const GroupDetailsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { groupId } = useParams()
  const id = Number(groupId)

  // Группа
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Участники
  const [members, setMembers] = useState<GroupMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const loaderRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false) // защита от конкурентных вызовов

  // Табы
  const [selectedTab, setSelectedTab] =
    useState<"transactions" | "balance" | "analytics">("transactions")

  // Текущий пользователь
  const user = useUserStore(state => state.user)
  const currentUserId = user?.id ?? 0

  // Модалки
  const [addOpen, setAddOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  // лёгкая модалка контакта
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickUserId, setQuickUserId] = useState<number | null>(null)

  const isDeleted = Boolean((group as any)?.deleted_at)
  const isArchived = (group as any)?.status === "archived"
  const canLoadMembers = !!group && !isDeleted && !isArchived

  // Детали группы
  useEffect(() => {
    let cancelled = false
    const fetchGroup = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getGroupDetails(id)
        if (cancelled) return
        setGroup(data as Group)

        // Для archived/soft-deleted отдаём участников из detail и не докачиваем
        const deleted = Boolean((data as any)?.deleted_at)
        const archived = (data as any)?.status === "archived"
        const initialMembers = (data as any)?.members
        if ((deleted || archived) && Array.isArray(initialMembers)) {
          setMembers(initialMembers as GroupMember[])
          setHasMore(false) // критично: сразу закрываем пагинацию
          setPage(0)
        }
      } catch (err: any) {
        if (cancelled) return
        setError(err?.message || (t("group_not_found") as string))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (id) fetchGroup()
    return () => { cancelled = true }
  }, [id, t])

  // Дедуп + подгрузка участников (только для активных групп)
  const loadMembers = useCallback(async () => {
    if (!id || membersLoading || !hasMore || loadingRef.current || !canLoadMembers) return
    try {
      loadingRef.current = true
      setMembersLoading(true)
      const res = await getGroupMembers(id, page * PAGE_SIZE, PAGE_SIZE)
      const newItems: GroupMember[] = res.items || []

      // дедуп по user.id
      const map = new Map<number, GroupMember>()
      for (const m of [...members, ...newItems]) {
        if (m?.user?.id != null) map.set(m.user.id, m)
      }
      const merged = Array.from(map.values())
      setMembers(merged)

      const currentCount = (page * PAGE_SIZE) + newItems.length
      setHasMore(currentCount < (res.total || 0))
      setPage(p => p + 1)
    } catch {
      // ignore
    } finally {
      setMembersLoading(false)
      loadingRef.current = false
    }
  }, [id, membersLoading, hasMore, page, members, canLoadMembers])

  // Сброс пэйджера при смене id
  useEffect(() => {
    setMembers([])
    setPage(0)
    setHasMore(true)
  }, [id])

  // Первичная загрузка участников: запускаем ТОЛЬКО когда знаем состояние группы и она активна
  useEffect(() => {
    if (!group) return
    if (!canLoadMembers) return
    if (hasMore && !membersLoading) { void loadMembers() }
  }, [group, canLoadMembers, hasMore, membersLoading, loadMembers])

  // Инфинити-скролл для участников — только для активных групп
  useEffect(() => {
    if (!canLoadMembers || membersLoading || !hasMore || !loaderRef.current) return
    const node = loaderRef.current
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !membersLoading) {
        void loadMembers()
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [canLoadMembers, membersLoading, hasMore, loadMembers])

  // Навигация (запрет редактирования для архивных/удалённых)
  const handleSettingsClick = () => {
    if (!group) return
    if (isDeleted) {
      window.alert(t("group_modals.edit_blocked_deleted") as string)
      return
    }
    if (isArchived) {
      window.alert(t("group_modals.edit_blocked_archived") as string)
      return
    }
    navigate(`/groups/${group.id}/settings`)
  }

  const handleBalanceClick = () => setSelectedTab("balance")

  // клик по мини-карточке участника => лёгкая модалка
  const handleParticipantClick = (userId: number) => {
    if (!userId) return
    if (userId === currentUserId) {
      navigate("/profile")
      return
    }
    setQuickUserId(userId)
    setQuickOpen(true)
  }

  // Блокирующие обработчики для Invite/Add — такое же поведение, как при редактировании
  const handleInviteClick = () => {
    if (isDeleted) {
      window.alert(t("group_modals.edit_blocked_deleted") as string)
      return
    }
    if (isArchived) {
      window.alert(t("group_modals.edit_blocked_archived") as string)
      return
    }
    setInviteOpen(true)
  }

  const handleAddClick = () => {
    if (isDeleted) {
      window.alert(t("group_modals.edit_blocked_deleted") as string)
      return
    }
    if (isArchived) {
      window.alert(t("group_modals.edit_blocked_archived") as string)
      return
    }
    setAddOpen(true)
  }

  // Безопасный колбэк для кнопки «добавить транзакцию» во вкладке
  const handleAddTransaction = () => {
    if (isDeleted) {
      window.alert(t("group_modals.edit_blocked_deleted") as string)
      return
    }
    if (isArchived) {
      window.alert(t("group_modals.edit_blocked_archived") as string)
      return
    }
    setCreateTxOpen(true)
  }

  // Ошибки/загрузка
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--tg-hint-color)]">
        {t("loading")}
      </div>
    )
  }
  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-red-500">
        {error || t("group_not_found")}
      </div>
    )
  }

  const existingMemberIds = members.map(m => m.user.id)

  return (
    <div className="relative w-full min-h-screen bg-[var(--tg-bg-color)] text-[var(--tg-text-color)] flex flex-col">
      {/* Шапка группы */}
      <GroupHeader
        group={group}
        onSettingsClick={handleSettingsClick}
        onBalanceClick={handleBalanceClick}
      />

      {/* Лента участников */}
      <ParticipantsScroller
        members={members}
        currentUserId={currentUserId}
        onParticipantClick={handleParticipantClick}
        onInviteClick={handleInviteClick}
        onAddClick={handleAddClick}
        // всегда передаём функцию (тип строгий), а внутри — гейт
        loadMore={() => {
          if (hasMore && canLoadMembers && !membersLoading) {
            void loadMembers()
          }
        }}
        hasMore={hasMore && canLoadMembers}
        loading={membersLoading}
        ownerId={group.owner_id}
      />

      {/* Вкладки */}
      <div className="w-full max-w-xl mx-auto px-0">
        <GroupTabs selected={selectedTab} onSelect={setSelectedTab} className="mb-0" />
      </div>

      {/* Контент вкладок */}
      <div className="w-full max-w-xl mx-auto flex-1 px-0 pb-12 mt-1">
        {selectedTab === "transactions" && (
          isDeleted ? (
            // Для удалённой группы не рендерим тяжёлую вкладку, чтобы не было фоновых запросов
            <div className="px-4 py-6 text-sm text-[var(--tg-hint-color)]">
              {t("group_modals.edit_blocked_deleted")}
            </div>
          ) : (
            <GroupTransactionsTab
              loading={false}
              transactions={[]}
              onAddTransaction={handleAddTransaction}
              key={`tx-${id}-${isArchived ? "archived" : "active"}`}
            />
          )
        )}

        {selectedTab === "balance" && <GroupBalanceTab />}

        {selectedTab === "analytics" && <GroupAnalyticsTab />}
      </div>

      {/* Сентинел для участников (только для активных) */}
      {hasMore && canLoadMembers && <div ref={loaderRef} style={{ height: 1 }} />}

      {/* Модалка добавления участников — монтируем только когда открыта и группа активна */}
      {addOpen && !isDeleted && !isArchived && (
        <AddGroupMembersModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          groupId={id}
          existingMemberIds={existingMemberIds}
          onAdded={() => { /* no-op */ }}
        />
      )}

      {/* Модалка создания транзакции — монтируем только когда открыта */}
      {createTxOpen && (
        <CreateTransactionModal
          open={createTxOpen}
          onOpenChange={setCreateTxOpen}
          defaultGroupId={id}
          groups={group ? [{
            id: group.id,
            name: group.name,
            // @ts-ignore
            icon: (group as any).icon,
            // @ts-ignore
            color: (group as any).color,
          }] : []}
        />
      )}

      {/* Модалка инвайта в группу — монтируем только когда открыта и группа активна */}
      {inviteOpen && !isDeleted && !isArchived && (
        <InviteGroupModal open={inviteOpen} onClose={() => setInviteOpen(false)} groupId={id} />
      )}

      {/* Лёгкая модалка контакта */}
      {quickOpen && (
        <ContactQuickModal open={quickOpen} onClose={() => setQuickOpen(false)} userId={quickUserId} />
      )}
    </div>
  )
}

export default GroupDetailsPage

