// src/components/AddGroupModal.tsx

import { useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { useTranslation } from "react-i18next"
import GroupAvatar from "./GroupAvatar"
import Avatar from "./Avatar"
import { useFriendsStore } from "../store/friendsStore"
import type { GroupCreate, GroupUser } from "../types/group"

type Props = {
  open: boolean
  onClose: () => void
  onCreate: (data: GroupCreate) => Promise<any>
  ownerId: number
}

/**
 * Модалка создания группы:
 * - Ввод названия и описания группы
 * - Выбор участников (из друзей)
 * - Валидация: нельзя создать группу без названия
 * - Лоадер на кнопке, обработка ошибок
 */
const AddGroupModal = ({ open, onClose, onCreate, ownerId }: Props) => {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selected, setSelected] = useState<GroupUser[]>([])
  const { friends, loading } = useFriendsStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggleFriend = (friend: GroupUser) => {
    setSelected(prev =>
      prev.find(u => u.id === friend.id)
        ? prev.filter(u => u.id !== friend.id)
        : [...prev, friend]
    )
  }

  const handleSubmit = async () => {
    setError(null)
    if (!name.trim()) {
      setError(t("group_name_required"))
      return
    }
    setSaving(true)
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        owner_id: ownerId,
        user_ids: selected.map(u => u.id),
      })
      setName("")
      setDescription("")
      setSelected([])
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.detail || t("error_create_group"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Transition.Root show={open} as={Dialog} onClose={onClose}>
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
        <Dialog.Panel className="bg-[var(--tg-card-bg)] rounded-2xl px-5 py-6 w-full max-w-md shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-2 text-[var(--tg-text-color)]">
            {t("create_group")}
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
          {/* Список друзей для выбора участников */}
          <div className="mb-4">
            <div className="font-semibold mb-2">{t("add_participants")}</div>
            {loading && <div>{t("loading")}</div>}
            {!loading && friends.length === 0 && (
              <div className="text-[var(--tg-hint-color)]">{t("no_friends")}</div>
            )}
            <div className="flex flex-wrap gap-2">
              {friends.map(friend => (
                <button
                  key={friend.user.id}
                  type="button"
                  className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition ${
                    selected.find(u => u.id === friend.user.id)
                      ? "bg-[var(--tg-link-color)] text-white"
                      : "bg-[var(--tg-secondary-bg)]"
                  }`}
                  disabled={saving}
                  onClick={() =>
                    handleToggleFriend({
                      id: friend.user.id,
                      name: friend.user.first_name || friend.user.username || "",
                      telegram_id: friend.user.telegram_id,
                    })
                  }
                >
                  <Avatar
                    name={friend.user.first_name || friend.user.username}
                    src={friend.user.photo_url}
                    size={28}
                  />
                  <span className="truncate">{friend.user.first_name || friend.user.username}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Кнопки */}
          <button
            className="btn-primary w-full mt-4"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? t("saving") : t("create")}
          </button>
        </Dialog.Panel>
      </div>
    </Transition.Root>
  )
}

export default AddGroupModal
