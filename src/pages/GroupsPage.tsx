// src/pages/GroupsPage.tsx

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useUserStore } from "../store/userStore"
import { getGroupsByUser, createGroup } from "../api/groupsApi"
import AddGroupModal from "../components/AddGroupModal"
import GroupCard from "../components/GroupCard"

const GroupsPage = () => {
    const { t } = useTranslation()
    const user = useUserStore(state => state.user)
    const [groups, setGroups] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [addOpen, setAddOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Получить группы пользователя
    const fetchGroups = async (userId: number) => {
        setLoading(true)
        setError(null)
        try {
            const data = await getGroupsByUser(userId)
            setGroups(data)
        } catch (err: any) {
            setError(err?.message || t("error_loading_groups"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user?.id) fetchGroups(user.id)
        // eslint-disable-next-line
    }, [user?.id])

    // Вот эта функция теперь реально создает группу через API, а потом обновляет список
    const handleCreateGroup = async (data: any) => {
        try {
            await createGroup(data)
            if (user?.id) await fetchGroups(user.id)
            setAddOpen(false)
        } catch (err: any) {
            setError(err?.message || t("error_create_group"))
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">{t("groups")}</h1>
                <button
                    className="btn-primary px-4 py-2 rounded-xl font-medium"
                    onClick={() => setAddOpen(true)}
                >
                    {t("add_group")}
                </button>
            </div>

            {loading && <div>{t("loading")}</div>}
            {error && <div className="text-red-500 mb-2">{error}</div>}

            {!loading && groups.length === 0 && (
                <div className="text-[var(--tg-hint-color)] mt-10 text-center">{t("no_groups")}</div>
            )}

            <div className="grid gap-3">
                {groups.map(group => (
                    <GroupCard key={group.id} group={group} />
                ))}
            </div>

            <AddGroupModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                ownerId={user?.id || 0}
                onCreate={handleCreateGroup}
            />
        </div>
    )
}

export default GroupsPage
