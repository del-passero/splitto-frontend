import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { useTranslation } from "react-i18next"
import GroupAvatar from "./GroupAvatar"
import Avatar from "./Avatar"
import type { Group, GroupUser } from "../types/group"

type Props = {
    open: boolean
    onClose: () => void
    group: Group
    members: GroupUser[]
    allFriends: GroupUser[]
    onSave: (data: { name: string; description: string; members: GroupUser[] }) => Promise<any>
}

const EditGroupModal = ({
    open,
    onClose,
    group,
    members: initialMembers,
    allFriends,
    onSave
}: Props) => {
    const { t } = useTranslation()
    const [name, setName] = useState(group.name)
    const [description, setDescription] = useState(group.description || "")
    const [members, setMembers] = useState<GroupUser[]>(initialMembers)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const ownerId = group.owner_id

    const handleAdd = (user: GroupUser) => {
        if (!members.find(m => m.id === user.id)) {
            setMembers([...members, user])
        }
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
            setError(e?.response?.data?.detail || t("error_edit_group"))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="fixed z-50 inset-0 overflow-y-auto" onClose={onClose}>
                <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0 bg-black/40">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                        leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30 transition-opacity" />
                    </Transition.Child>
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                    >
                        <div className="inline-block align-bottom bg-[var(--tg-card-bg)] rounded-2xl px-5 py-6 text-left shadow-xl w-full max-w-md transition-all">
                            <Dialog.Title className="text-xl font-bold mb-2 text-[var(--tg-text-color)]">
                                {t("edit_group")}
                            </Dialog.Title>
                            <div className="flex flex-col items-center gap-2 mb-4">
                                <GroupAvatar name={name} size={56} />
                                <input
                                    className="input mt-2 w-full"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder={t("group_name_placeholder")}
                                    maxLength={40}
                                    autoFocus
                                    disabled={saving}
                                />
                                <input
                                    className="input w-full"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder={t("group_description_placeholder")}
                                    maxLength={120}
                                    disabled={saving}
                                />
                                {error && (
                                    <div className="text-red-500 text-sm mt-1">{error}</div>
                                )}
                            </div>
                            <div className="mb-4">
                                <div className="font-semibold mb-2">{t("participants")}</div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {members.map(m => (
                                        <div key={m.id} className="flex items-center gap-2 px-2 py-1 bg-[var(--tg-secondary-bg)] rounded-lg">
                                            <Avatar name={m.name} size={28} />
                                            <span>
                                                {m.name}
                                                {m.id === ownerId && (
                                                    <span className="ml-1 text-[var(--tg-link-color)] text-xs align-middle" title={t("owner")}>👑</span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="font-semibold mb-1">{t("add_participants")}</div>
                                <div className="flex flex-wrap gap-2">
                                    {allFriends.filter(f => !members.find(m => m.id === f.id)).map(f => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            className="flex items-center gap-2 px-2 py-1 rounded-lg border transition bg-[var(--tg-secondary-bg)]"
                                            disabled={saving}
                                            onClick={() => handleAdd(f)}
                                        >
                                            <Avatar name={f.name} size={24} />
                                            <span>{f.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                <button
                                    className="btn-secondary flex-1"
                                    onClick={onClose}
                                    type="button"
                                    disabled={saving}
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    className="btn-primary flex-1"
                                    onClick={handleSave}
                                    disabled={saving}
                                    type="button"
                                >
                                    {saving ? t("saving") : t("save")}
                                </button>
                            </div>
                        </div>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default EditGroupModal
