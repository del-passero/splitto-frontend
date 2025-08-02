// src/pages/GroupDetailsPage.tsx

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import GroupAvatar from "../components/GroupAvatar"
import UserCard from "../components/UserCard"
import { getGroupDetails } from "../api/groupsApi"
import { getGroupMembers } from "../api/groupMembersApi"
import type { Group } from "../types/group"
import type { GroupMember } from "../types/group_member"

const PAGE_SIZE = 20

const GroupDetailsPage = () => {
  const { t } = useTranslation()
  const { groupId } = useParams()
  const id = Number(groupId)

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Состояния участников
  const [members, setMembers] = useState<GroupMember[]>([])
  const [membersTotal, setMembersTotal] = useState<number | null>(null)
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)
  const observer = useRef<IntersectionObserver>()

  // Загружаем детали группы
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
      // ↓↓↓ ВАЖНО: передаём ВСЕ аргументы!
      const res = await getGroupMembers(id, pageNum * PAGE_SIZE, PAGE_SIZE)
      setMembers(prev => [...prev, ...res.members])
      setMembersTotal(res.total)
      setHasMore(res.members.length === PAGE_SIZE)
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

  // Состояния загрузки/ошибки группы
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--tg-hint-color)]">
        {t("loading") || "Загрузка..."}
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
        {t("group_not_found") || "Группа не найдена"}
      </div>
    )
  }

  const ownerId = group.owner_id
  // Отсортируем: владелец первый
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

      {/* Список участников */}
      <div className="w-full max-w-md flex flex-col gap-2 px-4">
        {membersError ? (
          <div className="text-[var(--tg-hint-color)] text-center py-6">{membersError}</div>
        ) : sortedMembers.length > 0 ? (
          <>
            {sortedMembers.map((member) => (
              <UserCard
                key={member.user.id}
                name={
                  member.user.first_name || member.user.last_name
                    ? `${member.user.first_name || ""} ${member.user.last_name || ""}`.trim()
                    : member.user.username || t("not_specified")
                }
                username={member.user.username || t("not_specified")}
                photo_url={member.user.photo_url}
              />
            ))}
            {hasMore && (
              <div ref={loaderRef} style={{ height: 1, width: "100%" }} />
            )}
            {membersLoading && (
              <div className="py-3 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
            )}
            {typeof membersTotal === "number" && (
              <div className="text-xs text-center text-[var(--tg-hint-color)] pb-2">
                Показано: {members.length} из {membersTotal}
              </div>
            )}
          </>
        ) : (
          <div className="text-[var(--tg-hint-color)] text-center py-6">
            {t("no_members") || "Нет участников"}
          </div>
        )}
      </div>

      {/* Дополнительный контент группы */}
      <div className="px-4 mt-6">
        <div className="text-[var(--tg-hint-color)] text-center py-8">
          {t("group_details_coming_soon") || "Функционал группы скоро будет добавлен"}
        </div>
      </div>
    </div>
  )
}

export default GroupDetailsPage
