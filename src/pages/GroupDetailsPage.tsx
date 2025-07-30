// src/pages/GroupDetailsPage.tsx

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import CardSection from "../components/CardSection"
import GroupAvatar from "../components/GroupAvatar"
import Avatar from "../components/Avatar"
import { useGroupMembersStore } from "../store/useGroupMembersStore"
import { getGroupById, updateGroup } from "../api/groupsApi"
import EditGroupModal from "../components/EditGroupModal"
import InviteGroupModal from "../components/InviteGroupModal"
import { useFriendsStore } from "../store/friendsStore"
import type { Group, GroupUser } from "../types/group"

/**
 * Страница просмотра одной группы:
 * - Аватар, название, описание
 * - Кнопка "Редактировать" (EditGroupModal)
 * - Кнопка "Пригласить по ссылке" (InviteGroupModal)
 * - Список участников, значок 👑 у владельца
 */

const GroupDetailsPage = () => {
  const { t } = useTranslation()
  const { groupId } = useParams()
  const id = Number(groupId)
  const [group, setGroup] = useState<Group | null>(null)
  const { membersByGroup, fetchMembers, loading } = useGroupMembersStore()
  const [editOpen, setEditOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const { friends, fetchFriends } = useFriendsStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      getGroupById(id).then(setGroup)
      fetchMembers(id)
      fetchFriends()
    }
    // eslint-disable-next-line
  }, [id])

  const members = membersByGroup[id] || []

  // Обработка сохранения изменений из EditGroupModal
  const handleEditSave = async (updated: {
    name: string
    description: string
    members: GroupUser[]
  }) => {
    if (!group) return
    // Обновить название и описание
    await updateGroup(group.id, {
      name: updated.name,
      description: updated.description,
    })
    setGroup({ ...group, name: updated.name, description: updated.description })
    // Добавить новых участников
    const prevIds = members.map(m => m.id)
    const toAdd = updated.members.filter(m => !prevIds.includes(m.id))
    for (const user of toAdd) {
      await useGroupMembersStore.getState().addMember(group.id, user)
    }
    await fetchMembers(group.id)
    setEditOpen(false)
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col items-center pt-6 pb-20 bg-[var(--tg-bg-color)]">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4 px-4">
        <button
          className="text-[var(--tg-link-color)] font-bold text-lg"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <div className="flex-1 text-center text-xl font-bold text-[var(--tg-text-color)]">
          {t("group")}
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={() => setEditOpen(true)}
          >
            {t("edit")}
          </button>
          <button
            className="btn-primary"
            onClick={() => setInviteOpen(true)}
          >
            {t("invite_by_link")}
          </button>
        </div>
      </div>
      {/* Карточка группы */}
      <CardSection>
        <div className="flex flex-col items-center gap-3 py-2">
          <GroupAvatar name={group?.name} size={64} />
          <div className="text-lg font-bold text-[var(--tg-text-color)]">
            {group?.name}
          </div>
          <div className="text-sm text-[var(--tg-hint-color)] mb-2">
            {group?.description}
          </div>
          {/* Участники */}
          <div className="w-full">
            <div className="font-semibold mb-2 text-[var(--tg-link-color)]">
              {t("participants")}
            </div>
            {loading && (
              <div className="text-[var(--tg-hint-color)]">{t("loading")}</div>
            )}
            {!loading && members.length === 0 && (
              <div className="text-[var(--tg-hint-color)]">{t("no_participants")}</div>
            )}
            <div className="flex flex-col gap-2">
              {members.map((user) => (
                <div key={user.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[var(--tg-hover-bg)]">
                  <Avatar name={user.name} size={36} />
                  <span className="font-medium text-[var(--tg-text-color)]">
                    {user.name}
                    {group && user.id === group.owner_id && (
                      <span className="ml-1 text-[var(--tg-link-color)] text-xs align-middle" title={t("owner")}>👑</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardSection>
      {/* Модалка редактирования */}
      {group && (
        <EditGroupModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          group={group}
          members={members}
          allFriends={friends.map(f => ({
            id: f.user.id,
            name: f.user.first_name || f.user.username || "",
            telegram_id: f.user.telegram_id,
          }))}
          onSave={handleEditSave}
        />
      )}
      {/* Модалка инвайта по ссылке */}
      {group && (
        <InviteGroupModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          groupId={group.id}
        />
      )}
    </div>
  )
}

export default GroupDetailsPage
