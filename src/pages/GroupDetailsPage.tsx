// src/pages/GroupDetailsPage.tsx

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import GroupAvatar from "../components/GroupAvatar"
import UserCard from "../components/UserCard"
import { getGroupDetails } from "../api/groupsApi"
import type { Group } from "../types/group"

const GroupDetailsPage = () => {
  const { t } = useTranslation()
  const { groupId } = useParams()
  const id = Number(groupId)

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Состояния загрузки/ошибки
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
  const members = group.members ?? []

  // Сортируем: владелец первый
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
        {sortedMembers.length > 0 ? (
          sortedMembers.map((member) => (
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
          ))
        ) : (
          <div className="text-[var(--tg-hint-color)] text-center py-6">
            {t("no_members") || "Нет участников"}
          </div>
        )}
      </div>

      {/* Дополнительный контент группы (например, транзакции) */}
      <div className="px-4 mt-6">
        <div className="text-[var(--tg-hint-color)] text-center py-8">
          {t("group_details_coming_soon") || "Функционал группы скоро будет добавлен"}
        </div>
      </div>
    </div>
  )
}

export default GroupDetailsPage
