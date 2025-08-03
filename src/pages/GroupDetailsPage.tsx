// src/pages/GroupDetailsPage.tsx

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import GroupAvatar from "../components/GroupAvatar"
import { getGroupDetails } from "../api/groupsApi"
import { getGroupMembers } from "../api/groupMembersApi"
import type { Group } from "../types/group"
import type { GroupMember } from "../types/group_member"
import GroupTabs from "../components/group/GroupTabs"
import GroupBalanceTab from "../components/group/GroupBalanceTab"

const PAGE_SIZE = 20

const tabs = [
  { key: "overview", label: "Обзор" },
  { key: "transactions", label: "Траты" },
  { key: "balance", label: "Баланс" },
  { key: "history", label: "История" },
  { key: "notes", label: "Заметки" },
  { key: "settings", label: "Настройки" },
]

const GroupDetailsPage = () => {
  const { t } = useTranslation()
  const { groupId } = useParams()
  const id = Number(groupId)

  const [selectedTab, setSelectedTab] = useState("overview")

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Участники
  const [members, setMembers] = useState<GroupMember[]>([])
  const [membersTotal, setMembersTotal] = useState<number | null>(null)
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)
  const observer = useRef<IntersectionObserver | null>(null)

  // Детали группы
  useEffect(() => {
    const fetchDetails = async () => {
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
    if (id) fetchDetails()
  }, [id])

  // Сброс участников при смене группы
  useEffect(() => {
    setMembers([])
    setMembersTotal(null)
    setPage(0)
    setHasMore(true)
    setMembersError(null)
  }, [id])

  // Подгрузка участников
  const loadMembers = useCallback(async (_page?: number) => {
    if (!id || membersLoading || !hasMore) return
    try {
      setMembersLoading(true)
      setMembersError(null)
      const pageNum = typeof _page === "number" ? _page : page
      const res = await getGroupMembers(id, pageNum * PAGE_SIZE, PAGE_SIZE)
      setMembers(prev => [...prev, ...(res.items || [])])
      setMembersTotal(res.total)
      setHasMore((res.items?.length || 0) === PAGE_SIZE)
      setPage(pageNum + 1)
    } catch (err: any) {
      setMembersError(err.message || "Ошибка загрузки участников")
    } finally {
      setMembersLoading(false)
    }
  }, [id, membersLoading, page, hasMore])

  // Инфинити-скролл
  useEffect(() => {
    if (membersLoading || !hasMore) return
    if (!loaderRef.current) return

    observer.current?.disconnect()
    observer.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !membersLoading && hasMore) {
        loadMembers()
      }
    })
    observer.current.observe(loaderRef.current)
    return () => observer.current?.disconnect()
  }, [membersLoading, hasMore, loadMembers])

  // Первая загрузка участников
  useEffect(() => {
    if (id) loadMembers(0)
    // eslint-disable-next-line
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--tg-hint-color)]">
        {t("group_loading")}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-red-500">
        {error}
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--tg-hint-color)]">
        {t("group_not_found")}
      </div>
    )
  }

  // Владелец первым
  const ownerId = group.owner_id
  const sortedMembers = [
    ...members.filter(m => m.user.id === ownerId),
    ...members.filter(m => m.user.id !== ownerId)
  ]

  return (
    <div className="w-full min-h-screen bg-[var(--tg-bg-color)] py-6 flex flex-col items-center">
      {/* Шапка группы */}
      <div className="flex flex-col items-center mb-6">
        <GroupAvatar name={group.name} size={72} className="mb-2" />
        <div className="font-semibold text-2xl text-[var(--tg-text-color)] mb-1">
          {group.name}
        </div>
        {group.description && (
          <div className="text-[var(--tg-hint-color)] text-sm mb-1 text-center px-4">
            {group.description}
          </div>
        )}
      </div>
      {/* Вкладки */}
      <GroupTabs
        tabs={tabs.map(tab => ({
          key: tab.key,
          label: t(`group_tab_${tab.key}`)
        }))}
        selected={selectedTab}
        onSelect={setSelectedTab}
        className="mb-2"
      />
      <div className="w-full max-w-xl mx-auto px-2">
        {selectedTab === "balance" && (
          <GroupBalanceTab
            group={group}
            members={members}
            membersError={membersError}
            membersLoading={membersLoading}
            hasMore={hasMore}
            loaderRef={loaderRef}
            sortedMembers={sortedMembers}
            membersTotal={membersTotal}
          />
        )}
        {/* Остальные вкладки (заглушки) */}
        {selectedTab !== "balance" && (
          <div className="text-center text-[var(--tg-hint-color)] py-10">
            {t(`group_tab_${selectedTab}`)}
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupDetailsPage
