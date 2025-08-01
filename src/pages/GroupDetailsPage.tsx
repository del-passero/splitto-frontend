// src/pages/GroupDetailsPage.tsx

import { useParams } from "react-router-dom"
import { useGroupsStore } from "../store/groupsStore"
import { useTranslation } from "react-i18next"
import GroupAvatar from "../components/GroupAvatar"
import Avatar from "../components/Avatar"

const GroupDetailsPage = () => {
  const { t } = useTranslation()
  const { groupId } = useParams()
  const id = Number(groupId)

  const group = useGroupsStore(state =>
    state.groups.find(g => g.id === id)
  )

  console.log("[GroupDetailsPage] ID из URL:", id)
  console.log("[GroupDetailsPage] Найденная группа:", group)

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--tg-hint-color)]">
        {t("group_not_found") || "Группа не найдена"}
      </div>
    )
  }

  const ownerId = group.owner_id
  const members = group.members ?? []

  console.log("[GroupDetailsPage] Участники группы (group.members):", members)

  const sortedMembers = [
    ...members.filter(m => (m.user ? m.user.id === ownerId : m.id === ownerId)),
    ...members.filter(m => (m.user ? m.user.id !== ownerId : m.id !== ownerId))
  ]

  console.log("[GroupDetailsPage] Отсортированные участники:", sortedMembers)

  return (
    <div className="w-full min-h-screen bg-[var(--tg-bg-color)] py-6">
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

        <div className="flex items-center mt-2">
          {sortedMembers.map((member, idx) => {
            const user = member.user || member
            console.log(`[GroupDetailsPage] Участник #${idx}:`, user)

            return (
              <div
                key={user.id}
                className={`rounded-full border-2 ${
                  idx === 0 ? "border-[var(--tg-link-color)]" : "border-[var(--tg-card-bg)]"
                } bg-[var(--tg-bg-color)]`}
                style={{
                  width: idx === 0 ? 42 : 36,
                  height: idx === 0 ? 42 : 36,
                  marginLeft: idx > 0 ? -10 : 0
                }}
                title={
                  user.first_name
                    ? `${user.first_name} ${user.last_name || ""}`.trim()
                    : user.username || ""
                }
              >
                <Avatar
                  name={
                    user.first_name
                      ? `${user.first_name} ${user.last_name || ""}`.trim()
                      : user.username || ""
                  }
                  src={user.photo_url}
                  size={idx === 0 ? 42 : 36}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4">
        <div className="text-[var(--tg-hint-color)] text-center py-8">
          {t("group_details_coming_soon") || "Функционал группы скоро будет добавлен"}
        </div>
      </div>
    </div>
  )
}

export default GroupDetailsPage
