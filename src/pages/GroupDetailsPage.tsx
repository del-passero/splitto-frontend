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

const PAGE_SIZE = 24

const GroupDetailsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { groupId } = useParams()
  const id = Number(groupId)

  // Групповой стейт
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Участники
  const [members, setMembers] = useState<GroupMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Табы — по умолчанию открыт "Баланс"
  const [selectedTab, setSelectedTab] = useState<"transactions" | "balance" | "analytics">("balance")

  // User
  const user = useUserStore(state => state.user)
  const currentUserId = user?.id ?? 0
  const isOwner = !!(group && String(currentUserId) === String(group.owner_id))

  // Заглушки (долги/балансы/транзакции — сделаешь позже)
  const balances: Record<number, number> = {}
  const transactions: any[] = []
  const myBalance = 0
  const myDebts: any[] = []
  const allDebts: any[] = []

  // Загрузка деталей группы
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getGroupDetails(id)
        setGroup(data)
      } catch (err: any) {
        setError(err.message || "Ошибка загрузки группы")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchGroup()
  }, [id])

  // Загрузка участников (с пагинацией)
  const loadMembers = useCallback(async () => {
    if (!id || membersLoading || !hasMore) return
    try {
      setMembersLoading(true)
      const res = await getGroupMembers(id, page * PAGE_SIZE, PAGE_SIZE)
      setMembers(prev => [...prev, ...(res.items || [])])
      setHasMore((res.items?.length || 0) === PAGE_SIZE)
      setPage(p => p + 1)
    } catch {
      // ignore
    } finally {
      setMembersLoading(false)
    }
  }, [id, membersLoading, hasMore, page])

  useEffect(() => {
    setMembers([])
    setPage(0)
    setHasMore(true)
  }, [id])

  useEffect(() => {
    loadMembers()
    // eslint-disable-next-line
  }, [id])

  // Инфинити-скролл для участников
  useEffect(() => {
    if (membersLoading || !hasMore || !loaderRef.current) return
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !membersLoading) {
        loadMembers()
      }
    })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [membersLoading, hasMore, loadMembers])

  // Действия
  const handleSettingsClick = () => {
    if (!group) return
    navigate(`/groups/${group.id}/settings`)
  }
  const handleBalanceClick = () => setSelectedTab("balance")

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

  return (
    <div className="w-full min-h-screen bg-[var(--tg-bg-color)] flex flex-col items-center">
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
        onParticipantClick={handleBalanceClick}
        onInviteClick={() => {/* откроешь модалку */}}
        onAddClick={() => {/* откроешь модалку */}}
        loadMore={loadMembers}
        hasMore={hasMore}
        loading={membersLoading}
      />
      {/* Панель вкладок */}
      <GroupTabs
        selected={selectedTab}
        onSelect={setSelectedTab}
        className="mb-1"
      />
      <div className="w-full max-w-xl mx-auto flex-1 px-2 pb-12">
        {selectedTab === "transactions" && (
          <GroupTransactionsTab
            loading={false}
            transactions={transactions}
            onAddTransaction={() => {/* откроешь форму добавления */}}
          />
        )}
        {selectedTab === "balance" && (
          <GroupBalanceTab
            myBalance={myBalance}
            myDebts={myDebts}
            allDebts={allDebts}
            loading={false}
            onFabClick={() => {/* откроешь форму добавления платежа */}}
          />
        )}
        {selectedTab === "analytics" && <GroupAnalyticsTab />}
      </div>
      {/* Loader для инфинити-скролла */}
      {hasMore && <div ref={loaderRef} style={{ height: 1 }} />}
    </div>
  )
}

export default GroupDetailsPage
