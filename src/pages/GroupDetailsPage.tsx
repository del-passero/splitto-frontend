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

// ↓↓↓ ДОБАВЛЕНО: лёгкая модалка контакта
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

  // Табы — по умолчанию «Транзакции»
  const [selectedTab, setSelectedTab] =
    useState<"transactions" | "balance" | "analytics">("transactions")

  // Текущий пользователь
  const user = useUserStore(state => state.user)
  const currentUserId = user?.id ?? 0

  // Модалки
  const [addOpen, setAddOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  // ↓↓↓ ДОБАВЛЕНО: состояние для ContactQuickModal
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickUserId, setQuickUserId] = useState<number | null>(null)

  // Заглушка для списка транзакций (список здесь не грузим — грузит таб)
  const transactions: any[] = []

  // Детали группы
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getGroupDetails(id)
        setGroup(data as Group)

        // Read-only режим для archived/soft-deleted
        const isDeleted = Boolean((data as any)?.deleted_at)
        const isArchived = (data as any)?.status === "archived"
        const initialMembers = (data as any)?.members
        if ((isDeleted || isArchived) && Array.isArray(initialMembers) && initialMembers.length > 0) {
          setMembers(initialMembers as GroupMember[])
          setHasMore(false)
        }
      } catch (err: any) {
        setError(err?.message || (t("group_not_found") as string))
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchGroup()
  }, [id, t])

  // Подгрузка участников (для активных групп)
  const loadMembers = useCallback(async () => {
    if (!id || membersLoading || !hasMore) return
    try {
      setMembersLoading(true)
      const res = await getGroupMembers(id, page * PAGE_SIZE, PAGE_SIZE)
      const newItems = res.items || []
      setMembers(prev => [...prev, ...newItems])

      const currentCount = (page * PAGE_SIZE) + newItems.length
      setHasMore(currentCount < (res.total || 0))
      setPage(p => p + 1)
    } catch {
      // ignore
    } finally {
      setMembersLoading(false)
    }
  }, [id, membersLoading, hasMore, page])

  // Сброс пэйджера при смене id
  useEffect(() => {
    setMembers([])
    setPage(0)
    setHasMore(true)
  }, [id])

  // Первичная загрузка участников
  useEffect(() => {
    if (hasMore) { void loadMembers() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hasMore])

  // Инфинити-скролл для участников
  useEffect(() => {
    if (membersLoading || !hasMore || !loaderRef.current) return
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !membersLoading) {
        void loadMembers()
      }
    })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [membersLoading, hasMore, loadMembers])

  // Навигация (запрет редактирования для архивных/удалённых)
  const handleSettingsClick = () => {
    if (!group) return
    if ((group as any).deleted_at) {
      window.alert(t("group_modals.edit_blocked_deleted") as string)
      return
    }
    if ((group as any).status === "archived") {
      window.alert(t("group_modals.edit_blocked_archived") as string)
      return
    }
    navigate(`/groups/${group.id}/settings`)
  }

  const handleBalanceClick = () => setSelectedTab("balance")

  // ↓↓↓ клик по мини-карточке участника => лёгкая модалка
  const handleParticipantClick = (userId: number) => {
    if (!userId) return
    if (userId === currentUserId) {
      navigate("/profile")
      return
    }
    setQuickUserId(userId)
    setQuickOpen(true)
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
        onInviteClick={() => setInviteOpen(true)}
        onAddClick={() => setAddOpen(true)}
        // всегда передаём функцию (() => void), без undefined
        loadMore={() => { if (hasMore) { void loadMembers() } }}
        hasMore={hasMore}
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
          <GroupTransactionsTab
            loading={false}
            transactions={[]}
            onAddTransaction={() => setCreateTxOpen(true)}
          />
        )}

        {selectedTab === "balance" && <GroupBalanceTab />}

        {selectedTab === "analytics" && <GroupAnalyticsTab />}
      </div>

      {/* Сентинел для участников */}
      {hasMore && <div ref={loaderRef} style={{ height: 1 }} />}

      {/* Модалка добавления участников */}
      <AddGroupMembersModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        groupId={id}
        existingMemberIds={existingMemberIds}
        onAdded={() => { /* перезагрузишь при необходимости */ }}
      />

      {/* Модалка создания транзакции */}
      <CreateTransactionModal
        open={createTxOpen}
        onOpenChange={setCreateTxOpen}
        defaultGroupId={id}
        groups={group ? [{
          id: group.id,
          name: group.name,
          // @ts-ignore — если есть в типе
          icon: (group as any).icon,
          // @ts-ignore
          color: (group as any).color,
        }] : []}
      />

      {/* Модалка инвайта в группу */}
      <InviteGroupModal open={inviteOpen} onClose={() => setInviteOpen(false)} groupId={id} />

      {/* Лёгкая модалка контакта */}
      <ContactQuickModal open={quickOpen} onClose={() => setQuickOpen(false)} userId={quickUserId} />
    </div>
  )
}

export default GroupDetailsPage
