import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useGroupsStore } from "../store/useGroupsStore"
import AddGroupModal from "../components/AddGroupModal"
import GroupCard from "../components/GroupCard"
import type { Friend } from "../types/friend"

const GroupsPage = () => {
    const { t } = useTranslation()
    const groups = useGroupsStore(state => state.groups)
    const fetchGroups = useGroupsStore(state => state.fetchGroups)
    const [addOpen, setAddOpen] = useState(false)

    useEffect(() => { fetchGroups() }, [])

    const handleCreateGroup = async (data: { name: string; description: string; members: Friend[] }) => {
        await useGroupsStore.getState().createGroup(data)
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
                    : groups.map(group => <GroupCard key={group.id} group={group} />)
                }
            </div>
        </>
    )
}
export default GroupsPage
