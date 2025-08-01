/**
 * Страница отдельной группы (GroupDetailsPage)
 * Использует только список групп из стора, никаких fetch по id!
 * Не использует groupDetails, groupDetailsLoading, groupDetailsError.
 * Показывает заглушку, если группа не найдена.
 */

import { useParams } from "react-router-dom"
import { useGroupsStore } from "../store/groupsStore"
import { useTranslation } from "react-i18next"
import GroupAvatar from "../components/GroupAvatar"
import Avatar from "../components/Avatar"

const GroupDetailsPage = () => {
  const { t } = useTranslation()
  const { groupId } = useParams()
  const id = Number(groupId)

  // Просто ищем нужную группу среди загруженных
  const group = useGroupsStore(state =>
    state.groups.find(g => g.id === id)
  )

  // Если не нашли — показываем заглушку
  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--tg-hint-color)]">
        {t("group_not_found") || "Группа не найдена"}
      </div>
    )
  }

  // Владелец — первый в списке, остальные после
  const ownerId = group.owner_id
  const members = group.members ?? []
  const sortedMembers = [
    ...members.filter(m => m.user.id === ownerId),
    ...members.filter(m => m.user.id !== ownerId)
  ]

  return (
    <div className="w-full min-h-screen bg-[var(--tg-bg-color)] py-6">
      {/* Шапка */}
      <div className="flex flex-col items-center mb-6">
        <GroupAvatar name={group.name} size={72} className="mb-2" />
        <div className="font-semibold text-2xl text-[var(--tg-text-color)] mb-1">
          {group.name}
        </div>
        {group.description && (
          <div className="text-[var(--tg-hint-color)] text-sm mb-1">
            {group.description}
          </div>
        )}
        <div className="flex items-center mt-2 gap-[-12px]">
          {sortedMembers.map((member, idx) => (
            <div
              key={member.user.id}
              style={{
                marginLeft: idx > 0 ? -10 : 0,
                width: idx === 0 ? 42 : 36,
                height: idx === 0 ? 42 : 36
              }}
              className={
                "rounded-full border-2 " +
                (idx === 0
                  ? "border-[var(--tg-link-color)]"
                  : "border-[var(--tg-card-bg)]") +
                " bg-[var(--tg-bg-color)]"
              }
              title={
                member.user.first_name
                  ? `${member.user.first_name} ${member.user.last_name || ""}`.trim()
                  : member.user.username || ""
              }
            >
              <Avatar
                name={
                  member.user.first_name
                    ? `${member.user.first_name} ${member.user.last_name || ""}`.trim()
                    : member.user.username || ""
                }
                src={member.user.photo_url}
                size={idx === 0 ? 42 : 36}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Остальной контент страницы сюда (транзакции, действия и пр.) */}
      <div className="px-4">
        {/* Тут будет список расходов, кнопки и т.д. */}
        <div className="text-[var(--tg-hint-color)] text-center py-8">
          {t("group_details_coming_soon") || "Функционал группы скоро будет добавлен"}
        </div>
      </div>
    </div>
  )
}

export default GroupDetailsPage
