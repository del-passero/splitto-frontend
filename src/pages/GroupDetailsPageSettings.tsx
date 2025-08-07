import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getGroupDetails } from "../api/groupsApi"
import { getGroupMembers } from "../api/groupMembersApi"
import { useUserStore } from "../store/userStore"
import type { Group } from "../types/group"
import type { GroupMember } from "../types/group_member"
import GroupHeader from "../components/group/GroupHeader"
import GroupSettingsTabs from "../components/group/GroupSettingsTabs"
import GroupSettingsTab from "../components/group/GroupSettingsTab"
import GroupMembersTab from "../components/group/GroupMembersTab"
import CardSection from "../components/CardSection"

const PAGE_SIZE = 24

const GroupDetailsPageSettings = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { groupId } = useParams()
  const id = Number(groupId)

  // Стейты
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<"settings" | "members">("settings")
  const [members, setMembers] = useState<GroupMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // User
  const user = useUserStore(state => state.user)
  const currentUserId = user?.id ?? 0
  const isOwner = !!(group && String(currentUserId) === String(group.owner_id))

  // Загрузка группы
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

  // Загрузка участников с offset
  const loadMembers = useCallback(async () => {
    if (!id || membersLoading || !hasMore) return
    try {
      setMembersLoading(true)
      const res = await getGroupMembers(id, members.length, PAGE_SIZE)
      setMembers(prev => [...prev, ...(res.items || [])])
      setHasMore((members.length + (res.items?.length || 0)) < (res.total || 0))
    } catch {
      // ignore
    } finally {
      setMembersLoading(false)
    }
  }, [id, members.length, membersLoading, hasMore])

  // Сброс при смене id
  useEffect(() => {
    setMembers([])
    setHasMore(true)
  }, [id])

  // Первичная загрузка
  useEffect(() => {
    loadMembers()
    // eslint-disable-next-line
  }, [id])

  // Хэндлеры для экшенов (заглушки)
  const goToGroup = () => navigate(`/groups/${groupId}`)
  const handleEdit = () => { /* откроешь модалку */ }
  const handleLeave = () => { /* откроешь модалку */ }
  const handleDelete = () => { /* откроешь модалку */ }
  const handleInvite = () => { /* откроешь модалку */ }
  const handleAdd = () => { /* откроешь модалку */ }
  const handleRemove = (userId: number) => { /* откроешь модалку */ }
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

  return (
    <div className="w-full min-h-screen bg-[var(--tg-bg-color)] flex flex-col items-center">
      <GroupHeader
        group={group}
        onSettingsClick={handleEdit}
        onBalanceClick={goToGroup}
        isEdit
      />
      {/* Единая панель табов */}
      <CardSection className="px-0 py-0 mb-2">
        <GroupSettingsTabs
          selected={selectedTab}
          onSelect={setSelectedTab as (key: "settings" | "members") => void}
          className="mb-0"
        />
        <div className="w-full max-w-xl mx-auto flex-1 px-2 pb-12 mt-1">
          {selectedTab === "settings" && (
            <GroupSettingsTab
              isOwner={isOwner}
              onLeave={handleLeave}
              onDelete={handleDelete}
              onSaveAndExit={handleSaveAndExit}
            />
          )}
          {selectedTab === "members" && (
            <GroupMembersTab
              members={members}
              isOwner={isOwner}
              onRemove={handleRemove}
              onInvite={handleInvite}
              onAdd={handleAdd}
              onSaveAndExit={handleSaveAndExit}
              loading={membersLoading}
              fetchMore={loadMembers}
              hasMore={hasMore}
            />
          )}
        </div>
      </CardSection>
    </div>
  )
}

export default GroupDetailsPageSettings
