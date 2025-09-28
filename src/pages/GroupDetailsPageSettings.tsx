// src/pages/GroupDetailsPageSettings.tsx
import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  getGroupDetails,
  softDeleteGroup,
  // корректные имена из groupsApi:
  hideGroup,
  unhideGroup,
  archiveGroup,
  unarchiveGroup,
  restoreGroup,
} from "../api/groupsApi"
import { getGroupMembers, removeGroupMember, leaveGroup } from "../api/groupMembersApi"
import { useUserStore } from "../store/userStore"
import type { Group } from "../types/group"
import type { GroupMember } from "../types/group_member"

import GroupHeader from "../components/group/GroupHeader"
import GroupSettingsTabs from "../components/group/GroupSettingsTabs"
import GroupSettingsTab from "../components/group/GroupSettingsTab"
import GroupMembersTab from "../components/group/GroupMembersTab"
import CardSection from "../components/CardSection"
import AddGroupMembersModal from "../components/group/AddGroupMembersModal"
import { HandCoins } from "lucide-react"
import CreateTransactionModal from "../components/transactions/CreateTransactionModal"
import InviteGroupModal from "../components/group/InviteGroupModal"
import EditGroupModal from "../components/group/EditGroupModal"

const PAGE_SIZE = 24

const GroupDetailsPageSettings = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { groupId } = useParams()
  const id = Number(groupId)

  // группа
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // вкладка
  const [selectedTab, setSelectedTab] = useState<"settings" | "members">("members")

  // участники
  const [members, setMembers] = useState<GroupMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // модалки
  const [addOpen, setAddOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // user/owner
  const user = useUserStore(s => s.user)
  const currentUserId = user?.id ?? 0
  const isOwner = !!(group && String(currentUserId) === String(group.owner_id))
  const canManageMembers = !!(isOwner && group?.status === "active")
  const canLeave = !!(!isOwner && group?.status === "active")

  // производные флаги (для логики действий 1-в-1 с GroupCardMenu)
  const isArchived = !!(group && group.status === "archived")
  // soft-delete определяем по deleted_at / is_deleted; статус "deleted" у типа нет
  const isDeleted =
    !!(group && ((group as any).is_deleted || (group as any).deleted_at))
  const isHiddenForMe =
    !!(group && ((group as any).is_hidden_for_me || (group as any).hidden_for_me))

  // загрузка группы
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

  // загрузка участников
  const loadMembers = useCallback(async () => {
    if (!id || membersLoading || !hasMore) return
    try {
      setMembersLoading(true)
      const res = await getGroupMembers(id, members.length, PAGE_SIZE)
      const newItems = res.items || []
      setMembers(prev => [...prev, ...newItems])
      setHasMore((members.length + newItems.length) < (res.total || 0))
    } catch {
      // ignore
    } finally {
      setMembersLoading(false)
    }
  }, [id, members.length, membersLoading, hasMore])

  // сброс при смене id
  useEffect(() => {
    setMembers([])
    setHasMore(true)
  }, [id])

  // первичная загрузка
  useEffect(() => {
    loadMembers()
    // eslint-disable-next-line
  }, [id])

  // экшены
  const goToGroup = () => navigate(`/groups/${groupId}`)
  const goToGroupsList = () => navigate(`/groups`)

  const handleInvite = () => setInviteOpen(true)
  const handleAdd = () => setAddOpen(true)

  const handleRemove = async (memberId: number) => {
    try {
      if (group?.status !== "active") {
        alert("Группа архивирована — изменять состав нельзя")
        return
      }
      await removeGroupMember(memberId)
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (e: any) {
      console.error("Failed to remove member", e)
      alert(e?.message || "Не удалось удалить участника")
    }
  }

  const handleLeave = async () => {
    try {
      if (!id) return
      if (group?.status !== "active") {
        alert("Группа архивирована — выйти нельзя")
        return
      }
      const ok = window.confirm("Точно выйти из группы?")
      if (!ok) return
      await leaveGroup(id)
      goToGroupsList()
    } catch (e: any) {
      console.error("Failed to leave group", e)
      alert(e?.message || "Не удалось выйти из группы")
    }
  }

  // Confirm показан в самой вкладке (см. GroupSettingsTab — smartClick)
  const handleDelete = async () => {
    if (!id) return
    if (!isOwner) {
      alert("Удалять группу может только владелец")
      return
    }
    await softDeleteGroup(id)
    goToGroupsList()
  }

  // Действия «как в GroupCardMenu»
  const handleHide = async () => {
    if (!id) return
    await hideGroup?.(id)
    setGroup(prev => prev ? ({ ...prev, is_hidden_for_me: true } as any) : prev)
  }
  const handleUnhide = async () => {
    if (!id) return
    await unhideGroup?.(id)
    setGroup(prev => prev ? ({ ...prev, is_hidden_for_me: false } as any) : prev)
  }
  const handleArchive = async () => {
    if (!id) return
    await archiveGroup?.(id)
    setGroup(prev => prev ? ({ ...prev, status: "archived" } as Group) : prev)
  }
  const handleUnarchive = async () => {
    if (!id) return
    await unarchiveGroup?.(id)
    setGroup(prev => prev ? ({ ...prev, status: "active" } as Group) : prev)
  }
  const handleRestore = async (_opts?: { toActive?: boolean }) => {
    if (!id) return
    await restoreGroup?.(id)
    const data = await getGroupDetails(id)
    setGroup(data)
  }

  const handleSaveAndExit = goToGroup

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

  const existingMemberIds = members.map(m => m.user.id)

  return (
    <div className="w-full min-h-screen bg-[var(--tg-bg-color)] flex flex-col">
      {/* ЕДИНЫЙ хедер: тот же, что на GroupDetailsPage; здесь показываем карандаш */}
      <GroupHeader
        group={group}
        onSettingsClick={() => setEditOpen(true)}
        onBalanceClick={goToGroup}
        isEdit
      />

      {/* Табы — та же полоса, что в GroupTabs, без дополнительных боковых паддингов */}
      <CardSection className="px-0 py-0 mb-2">
        <GroupSettingsTabs
          selected={selectedTab}
          onSelect={setSelectedTab as (k: "settings" | "members") => void}
          className="mb-0"
        />

        {/* Контент вкладок — без max-w и боковых px, чтобы не было лишних «полей» */}
        <div className="w-full flex-1 pb-12 mt-1">
          {selectedTab === "settings" && (
            <GroupSettingsTab
              isOwner={isOwner}
              onLeave={() => {}}            // перенесено на вкладку участников
              onDelete={handleDelete}       // confirm и ошибки теперь внутри вкладки
              onSaveAndExit={handleSaveAndExit}
              // ↓ добавили для действий 1-в-1 как в GroupCardMenu
              flags={{
                isOwner,
                isArchived,
                isDeleted,
                isHiddenForMe,
              }}
              actions={{
                onHide: handleHide,
                onUnhide: handleUnhide,
                onArchive: handleArchive,
                onUnarchive: handleUnarchive,
                onRestore: handleRestore,
              }}
            />
          )}

          {selectedTab === "members" && (
            <GroupMembersTab
              members={members}
              isOwner={canManageMembers}
              onRemove={handleRemove}       // принимает memberId!
              onInvite={handleInvite}
              onAdd={handleAdd}
              onSaveAndExit={handleSaveAndExit}
              onLeave={handleLeave}
              loading={membersLoading}
              fetchMore={loadMembers}
              hasMore={hasMore}
              ownerId={group.owner_id}
              canLeave={canLeave}
            />
          )}
        </div>
      </CardSection>

      {/* модалка добавления участников */}
      <AddGroupMembersModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        groupId={id}
        existingMemberIds={existingMemberIds}
        onAdded={() => { /* window.location.reload() вызывается внутри модалки после успеха */ }}
      />

      {/* FAB создания транзакции для КОНКРЕТНОЙ группы */}
      <button
        type="button"
        onClick={() => setCreateTxOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[var(--tg-accent-color,#40A7E3)] text-white shadow-lg active:scale-95 transition flex items-center justify-center"
        aria-label={t("add_transaction")}
        title={t("add_transaction")}
      >
        <HandCoins size={24} strokeWidth={1.5} />
      </button>

      {/* Модалка создания транзакции: автоподставляем текущую группу */}
      <CreateTransactionModal
        open={createTxOpen}
        onOpenChange={setCreateTxOpen}
        groups={[{ id: group.id, name: group.name, icon: (group as any).icon, color: (group as any).color }]}
        defaultGroupId={id}
      />

      {/* Модалка инвайта в группу */}
      <InviteGroupModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        groupId={id}
        groupName={group.name}
      />

      {/* Модалка редактирования названия/описания группы */}
      <EditGroupModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        groupId={id}
        initialName={group.name}
        initialDescription={group.description || ""}
        onSaved={(updated) => {
          setGroup(prev => prev ? { ...prev, name: updated.name, description: updated.description ?? null } as Group : prev)
          setEditOpen(false)
          // жёстко обновляем страницу, чтобы гарантированно подтянуть новый аватар и пр.
          window.location.reload()
        }}
      />
    </div>
  )
}

export default GroupDetailsPageSettings
