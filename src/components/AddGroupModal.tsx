import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useFriendsStore } from "../store/friendsStore"
import Avatar from "./Avatar"

type Props = {
    open: boolean
    onClose: () => void
    ownerId: number
    onCreate: (data: { name: string; description: string; members: any[] }) => Promise<void>
}

const AddGroupModal = ({ open, onClose, ownerId, onCreate }: Props) => {
    const { t } = useTranslation()
    const friends = useFriendsStore(state => state.friends)
    const fetchFriends = useFriendsStore(state => state.fetchFriends)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [selected, setSelected] = useState<any[]>([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Загрузить друзей при открытии модалки
    useEffect(() => {
        if (open) fetchFriends()
        if (!open) {
            setName("")
            setDescription("")
            setSelected([])
            setError(null)
        }
    }, [open, fetchFriends])

    // Добавить/убрать участника
    const toggleMember = (user: any) => {
        if (selected.find(u => u.id === user.id)) {
            setSelected(selected.filter(u => u.id !== user.id))
        } else {
            setSelected([...selected, user])
        }
    }

    // Создать группу
    const handleCreate = async () => {
        if (!name.trim()) {
            setError(t("group_name_required"))
            return
        }
        setSaving(true)
        setError(null)
        try {
            await onCreate({
                name: name.trim(),
                description: description.trim(),
                members: [ownerId, ...selected.map(u => u.id)].filter((v, i, arr) => arr.indexOf(v) === i)
            })
        } catch (e: any) {
            setError(e?.message || t("error_create_group"))
        } finally {
            setSaving(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed z-50 inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-[var(--tg-bg-color)] rounded-2xl shadow-xl w-[90vw] max-w-md p-6">
                <div className="font-bold text-lg mb-4">{t("create_group")}</div>
                <input
                    className="input w-full mb-2"
                    placeholder={t("group_name_placeholder")}
                    maxLength={40}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={saving}
                    autoFocus
                />
                <input
                    className="input w-full mb-4"
                    placeholder={t("group_description_placeholder")}
                    maxLength={120}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={saving}
                />
                <div className="font-semibold mb-1">{t("add_participants")}</div>
                {friends.length === 0 ? (
                    <div className="text-[var(--tg-hint-color)] mb-3">{t("no_friends")}</div>
                ) : (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {friends.map(user => (
                            <button
                                type="button"
                                key={user.id}
                                className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition ${selected.find(u => u.id === user.id)
                                        ? "bg-[var(--tg-link-color)] text-white"
                                        : "bg-[var(--tg-secondary-bg)]"
                                    }`}
                                disabled={saving}
                                onClick={() => toggleMember(user)}
                            >
                                <Avatar name={user.name} src={user.photo_url} size={24} />
                                <span>{user.name}</span>
                                {selected.find(u => u.id === user.id) && <span>✓</span>}
                            </button>
                        ))}
                    </div>
                )}
                {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
                <div className="flex gap-2 mt-4">
                    <button className="btn-secondary flex-1" onClick={onClose} disabled={saving}>
                        {t("cancel")}
                    </button>
                    <button className="btn-primary flex-1" onClick={handleCreate} disabled={saving}>
                        {saving ? t("saving") : t("create_group")}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddGroupModal
