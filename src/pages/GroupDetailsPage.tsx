// src/pages/GroupDetailsPage.tsx

/**
 * Страница отдельной группы: 
 * — Получает id из маршрута, грузит детали группы и участников через store.
 * — Показывает аватар группы, название, описание, владельца, участников (их аватарки), резерв под долги.
 * — Полностью адаптирована под твой стиль, все подписи через i18n, поддержка тем.
 */

import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useGroupsStore } from "../store/groupsStore"
import CardSection from "../components/CardSection"
import GroupAvatar from "../components/GroupAvatar"
import Avatar from "../components/Avatar"

const GroupDetailsPage = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const groupId = Number(id)
  const {
    groupDetails,
    groupDetailsLoading,
    groupDetailsError,
    fetchGroupDetails
  } = useGroupsStore()

  useEffect(() => {
    if (groupId) fetchGroupDetails(groupId)
  }, [groupId, fetchGroupDetails])

  // До загрузки/если нет группы
  if (groupDetailsLoading) {
    return <div className="w-full flex justify-center items-center min-h-[300px] text-[var(--tg-hint-color)]">{t("loading")}</div>
  }
  if (groupDetailsError || !groupDetails) {
    return <div className="w-full flex justify-center items-center min-h-[300px] text-red-500">{groupDetailsError || t("group_not_found")}</div>
  }

  const members = groupDetails.members ?? []
  const ownerId = groupDetails.owner_id
  const sortedMembers = [
    ...members.filter(m => m.user.id === ownerId),
    ...members.filter(m => m.user.id !== ownerId),
  ]

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--tg-bg-color)] pb-6">
      <CardSection>
        <div className="flex flex-col items-center px-4 py-6">
          {/* Аватар и название */}
          <GroupAvatar
            name={groupDetails.name}
            size={74}
            className="mb-3"
          />
          <div className="font-bold text-xl mb-1 text-[var(--tg-text-color)] text-center">
            {groupDetails.name}
          </div>
          {groupDetails.description && (
            <div className="text-[var(--tg-hint-color)] text-sm mb-4 text-center">
              {groupDetails.description}
            </div>
          )}

          {/* Участники (аватарки, владелец больше) */}
          <div className="flex items-center justify-center mt-2 mb-6 flex-wrap gap-2">
            {sortedMembers.map((member, idx) => (
              <Avatar
                key={member.user.id}
                name={
                  member.user.first_name
                    ? `${member.user.first_name} ${member.user.last_name || ""}`.trim()
                    : member.user.username || ""
                }
                src={member.user.photo_url}
                size={idx === 0 ? 52 : 40} // Владелец крупнее
                className={idx === 0 ? "border-2 border-[var(--tg-link-color)] shadow" : "border border-[var(--tg-card-bg)]"}
              />
            ))}
          </div>

          {/* Зарезервировано под долги */}
          <div className="w-full flex justify-center mt-2">
            <span className="text-[var(--tg-hint-color)] text-sm font-medium">
              {t("debts_reserved")}
            </span>
          </div>
        </div>
      </CardSection>
    </div>
  )
}

export default GroupDetailsPage
