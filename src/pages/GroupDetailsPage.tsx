// src/pages/GroupDetailsPage.tsx

import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useGroupsStore } from "../store/groupsStore"
import CardSection from "../components/CardSection"
import GroupAvatar from "../components/GroupAvatar"
import Avatar from "../components/Avatar"

/**
 * Страница отдельной группы.
 * Показывает детальную инфу: название, описание, аватар, участников (с аватарками), владельца, и т.д.
 * В дальнейшем здесь появятся вкладки, статистика, долги, настройки и т.д.
 * Все подписи через i18n. Строгая поддержка темы и визуального стиля.
 */

const GroupDetailsPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const { t } = useTranslation()
  const { groups } = useGroupsStore()

  // Группа по ID (в виде строки и числа для совместимости)
  const group =
    groups.find(g => String(g.id) === groupId) ||
    groups.find(g => Number(g.id) === Number(groupId))

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-[var(--tg-bg-color)]">
        <div className="text-center text-[var(--tg-hint-color)] text-base py-8 px-4">
          {t("group_not_found")}
        </div>
      </div>
    )
  }

  // Владлец всегда первый, далее остальные участники (как и на карточке)
  const members = group.members ?? []
  const ownerId = group.owner_id
  const sortedMembers = [
    ...members.filter(m => m.user.id === ownerId),
    ...members.filter(m => m.user.id !== ownerId),
  ]

  return (
    <div className="min-h-screen w-full bg-[var(--tg-bg-color)] flex flex-col items-center pt-6 pb-8">
      <CardSection className="mb-4">
        {/* Верхний блок: Аватар и инфа о группе */}
        <div className="flex items-center gap-4 mb-3">
          <GroupAvatar name={group.name} size={60} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-2xl truncate text-[var(--tg-text-color)]">
              {group.name}
            </div>
            {group.description && (
              <div className="text-sm text-[var(--tg-hint-color)] truncate">
                {group.description}
              </div>
            )}
          </div>
        </div>
        {/* Участники */}
        <div className="mb-1 mt-3 text-sm font-medium text-[var(--tg-hint-color)]">
          {t("members")} ({members.length})
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {sortedMembers.map((member, idx) => (
            <div
              key={member.user.id}
              className={`flex flex-col items-center`}
              style={{
                marginRight: 8,
              }}
            >
              <Avatar
                name={
                  member.user.first_name
                    ? `${member.user.first_name} ${member.user.last_name || ""}`.trim()
                    : member.user.username || ""
                }
                src={member.user.photo_url}
                size={idx === 0 ? 44 : 36}
                className={
                  idx === 0
                    ? "border-2 border-[var(--tg-link-color)]"
                    : "border-2 border-[var(--tg-card-bg)]"
                }
              />
              <span
                className={`text-xs mt-1 ${idx === 0 ? "font-semibold text-[var(--tg-link-color)]" : "text-[var(--tg-hint-color)]"}`}
                title={
                  member.user.first_name
                    ? `${member.user.first_name} ${member.user.last_name || ""}`.trim()
                    : member.user.username || ""
                }
              >
                {idx === 0 ? t("owner") : ""}
              </span>
            </div>
          ))}
        </div>
      </CardSection>
      {/* Здесь далее появятся вкладки, статистика, операции, и т.д. */}
    </div>
  )
}

export default GroupDetailsPage
