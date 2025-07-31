// src/pages/GroupDetailsPage.tsx

/**
 * Страница отдельной группы.
 * Вверху: название группы, под ним — описание (если есть).
 * Далее секция участников (CardSection) — вертикальный список аватаров и имён участников.
 * Владелец всегда первый и дополнительно выделен (бейдж или цвет).
 * Все подписи через i18n, оформление строго по твоему стилю и темам.
 */

import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import CardSection from "../components/CardSection"
import Avatar from "../components/Avatar"
import { useGroupsStore } from "../store/groupsStore"

const GroupDetailsPage = () => {
  const { t } = useTranslation()
  const { groupId } = useParams()
  const {
    selectedGroup: group,
    groupLoading,
    groupError,
    fetchGroupDetails,
    clearSelectedGroup,
  } = useGroupsStore()

  // Получаем данные о группе при монтировании/смене groupId
  useEffect(() => {
    if (groupId) fetchGroupDetails(Number(groupId))
    return () => clearSelectedGroup()
  }, [groupId, fetchGroupDetails, clearSelectedGroup])

  // Сортируем участников: владелец всегда первый
  const members = group?.members || []
  const ownerId = group?.owner_id
  const sortedMembers = [
    ...members.filter(m => m.user.id === ownerId),
    ...members.filter(m => m.user.id !== ownerId)
  ]

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-[var(--tg-bg-color)] pb-8">
      <div className="w-full max-w-md px-4 pt-7 pb-2">
        {/* Название и описание группы */}
        {group && (
          <>
            <div className="font-bold text-2xl mb-1 text-[var(--tg-text-color)] truncate">{group.name}</div>
            {group.description && group.description.trim() !== "" && (
              <div className="text-[var(--tg-hint-color)] text-base mb-4">{group.description}</div>
            )}
          </>
        )}
      </div>

      {/* Секция участников */}
      <CardSection title={t("members")}>
        {groupLoading && (
          <div className="text-center py-6 text-[var(--tg-hint-color)]">{t("loading")}</div>
        )}
        {groupError && (
          <div className="text-center py-6 text-red-500">{groupError}</div>
        )}
        {!groupLoading && !groupError && sortedMembers.length === 0 && (
          <div className="text-center py-6 text-[var(--tg-hint-color)]">{t("empty_members")}</div>
        )}
        <div className="flex flex-col gap-2">
          {sortedMembers.map((member, idx) => (
            <div
              key={member.user.id}
              className={`flex items-center gap-4 px-3 py-2 rounded-xl
                ${idx === 0 ? "bg-[var(--tg-link-color)]/10" : ""}
              `}
            >
              <Avatar
                name={
                  member.user.first_name
                    ? `${member.user.first_name} ${member.user.last_name || ""}`.trim()
                    : member.user.username || ""
                }
                src={member.user.photo_url}
                size={48}
              />
              <div>
                <div className="font-semibold text-base text-[var(--tg-text-color)]">
                  {member.user.first_name
                    ? `${member.user.first_name} ${member.user.last_name || ""}`.trim()
                    : member.user.username || t("not_specified")}
                </div>
                {/* Бейдж “Владелец” у первого участника (owner) */}
                {idx === 0 && (
                  <div className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[var(--tg-link-color)] text-white text-xs font-semibold">
                    {t("owner")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardSection>
    </div>
  )
}

export default GroupDetailsPage
