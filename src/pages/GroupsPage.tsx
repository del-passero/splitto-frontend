import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useGroupsStore } from "../store/useGroupsStore"
import AddGroupModal from "../components/AddGroupModal"
import GroupCard from "../components/GroupCard"
import type { Friend } from "../types/friend"
import type { Group } from "../types/group" // если у тебя нет - создай!
import { useTelegramUser } from "../hooks/useTelegramUser"

const GroupsPage = () => {
    const { t } = useTranslation()
    const groups = useGroupsStore(state => state.groups) as Group[]
    const fetchGroups = useGroupsStore(state => state.fetchGroups)
    const createGroup = useGroupsStore(state => state.createGroup)
    const [addOpen, setAddOpen] = useState(false)

    const telegramUser = useTelegramUser()
    const owner_id = telegramUser?.id

    useEffect(() => {
        fetchGroups() // Не передаем аргументы, если не нужны!
    }, [fetchGroups])

    const handleCreateGroup = async (data: { name: string; description: string; members: Friend[] }) => {
        if (!owner_id) return
        await createGroup({
            name: data.name,
            description: data.description,
            owner_id,
            user_ids: data.members.map(m => m.friend.telegram_id),
        })
        await fetchGroups()
    }

    return (
        <>
            <AddGroupModal open={addOpen} onClose={() => setAddOpen(false)} onSave={handleCreateGroup} />
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">{t("groups")}</h1>
                <button className="btn-primary" onClick={() => setAddOpen(true)}>{t("add_group")}</button>
            </div>
            <div>
                {groups.length === 0
                    ? <div className="text-[var(--tg-hint-color)]">{t("no_groups")}</div>
                    : groups.map(group => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            members={group.members ?? []} // <-- если members обязательный, иначе убери это!
                        />
                    ))
                }
            </div>
        </>
    )
}
export default GroupsPage
