import { useState, useEffect } from "react"
import { Dialog } from "@headlessui/react"
import { useTranslation } from "react-i18next"
import { useFriendsStore } from "../store/friendsStore"
import type { Friend } from "../types/friend"

type Props = {
    open: boolean
    onClose: () => void
    onSave: (data: { name: string; description: string; members: Friend[] }) => Promise<any>
}

function getFriendDisplay(friend: Friend) {
    if (friend.name) return friend.name
    if (friend.username) return "@" + friend.username
    if (friend.telegram_id) return friend.telegram_id
    return "Без имени"
}

const AddGroupModal = ({ open, onClose, onSave }: Props) => {
    const { t } = useTranslation()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [members, setMembers] = useState<Friend[]>([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const friends = useFriendsStore(state => state.friends)
    const fetchFriends = useFriendsStore(state => state.fetchFriends)
    const loadingFriends = useFriendsStore(state => state.loading)

    useEffect(() => {
        if (open) {
            fetchFriends()
            setName("")
            setDescription("")
            setMembers([])
            setError(null)
        }
        // eslint-disable-next-line
    }, [open])

    const handleAdd = (friend: Friend) => {
        if (!members.find(m => m.id === friend.id)) {
            setMembers([...members, friend])
        }
    }

    const handleRemove = (id: number) => {
        setMembers(members.filter(m => m.id !== id))
    }

    const handleSave = async () => {
        setError(null)
        if (!name.trim()) {
            setError(t("group_name_required"))
            return
        }
        setSaving(true)
        try {
            await onSave({ name: name.trim(), description: description.trim(), members })
            onClose()
        } catch (e: any) {
            setError(e?.message || t("error_create_group"))
        } finally {
            setSaving(false)
        }
    }

    if (!open) return null

    return (
        <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-[var(--tg-card-bg)] rounded-2xl p-6 w-full max-w-md">
                <Dialog.Title className="text-xl font-bold mb-4">{t("create_group")}</Dialog.Title>
                <input
                    className="input mb-2 w-full"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t("group_name_placeholder")}
                    maxLength={40}
                    autoFocus
                    disabled={saving}
                />
                <input
                    className="input mb-4 w-full"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t("group_description_placeholder")}
                    maxLength={120}
                    disabled={saving}
                />
                {/* Участники */}
                <div className="mb-2">
                    <div className="font-semibold mb-1">{t("participants")}</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {members.map(friend => (
                            <span key={friend.id} className="px-2 py-1 bg-[var(--tg-secondary-bg)] rounded-lg flex items-center gap-2">
                                {getFriendDisplay(friend)}
                                <button type="button" className="ml-1 text-red-400" onClick={() => handleRemove(friend.id)}>✕</button>
                            </span>
                        ))}
                        {!members.length && <span className="text-[var(--tg-hint-color)]">{t("no_participants")}</span>}
                    </div>
                </div>
                {/* Список друзей */}
                <div className="mb-4">
                    <div className="font-semibold mb-1">{t("add_participants")}</div>
                    {loadingFriends ? (
                        <div>{t("loading")}</div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {friends
                                .filter(f => !members.find(m => m.id === f.id))
                                .map(friend => (
                                    <button
                                        key={friend.id}
                                        type="button"
                                        className="px-2 py-1 rounded-lg border bg-[var(--tg-secondary-bg)]"
                                        disabled={saving}
                                        onClick={() => handleAdd(friend)}
                                    >
                                        {getFriendDisplay(friend)}
                                    </button>
                                ))}
                            {!friends.length && <div className="text-[var(--tg-hint-color)]">{t("no_friends")}</div>}
                        </div>
                    )}
                </div>
                {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
                <div className="flex gap-2">
                    <button className="btn-secondary flex-1" onClick={onClose} disabled={saving}>{t("cancel")}</button>
                    <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                        {saving ? t("saving") : t("save")}
                    </button>
                </div>
            </div>
        </Dialog>
    )
}

export default AddGroupModal
