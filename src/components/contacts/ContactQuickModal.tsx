// src/components/contacts/ContactQuickModal.tsx

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import CardSection from "../CardSection"
import UserCard from "../UserCard"
import type { Friend, UserShort } from "../../types/friend"
import type { User } from "../../types/user"
import { getFriendDetail, getUserProfilePublic } from "../../api/friendsApi"

type Props = {
  open: boolean
  onClose: () => void
  userId: number | null
}

/** Берём «целевого» пользователя из FriendOut: это тот, чей id = friend_id */
function pickPersonFromFriendOut(f: Friend | null): UserShort | null {
  if (!f) return null
  const candidates = [f.user, f.friend].filter(Boolean) as UserShort[]
  return candidates.find(u => u.id === f.friend_id) || candidates[0] || null
}

export default function ContactQuickModal({ open, onClose, userId }: Props) {
  const { t } = useTranslation()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [friend, setFriend] = useState<Friend | null>(null)        // если это МОЙ друг
  const [publicUser, setPublicUser] = useState<User | null>(null)  // фоллбек, если не друг

  useEffect(() => {
    // ждём валидный number
    if (!open || typeof userId !== "number" || Number.isNaN(userId)) return
    const uid = userId as number

    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)
      setFriend(null)
      setPublicUser(null)
      try {
        // 1) пробуем как «моего друга»
        const f = await getFriendDetail(uid)
        if (!cancelled) setFriend(f)
      } catch (_) {
        // 2) фоллбек: публичный профиль по user_id
        try {
          const u = await getUserProfilePublic(uid)
          if (!cancelled) setPublicUser(u)
        } catch (e: any) {
          if (!cancelled) setError(e?.message || "error")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [open, userId])

  if (!open) return null

  const targetFromFriend = pickPersonFromFriendOut(friend)
  const displayName =
    (targetFromFriend?.name ||
      `${targetFromFriend?.first_name || ""} ${targetFromFriend?.last_name || ""}`.trim() ||
      (targetFromFriend?.username ? `@${targetFromFriend.username}` : "")) ||
    (publicUser?.name ||
      `${publicUser?.first_name || ""} ${publicUser?.last_name || ""}`.trim() ||
      (publicUser?.username ? `@${publicUser.username}` : "")) ||
    ""

  const username = targetFromFriend?.username ?? publicUser?.username
  const photo = targetFromFriend?.photo_url ?? publicUser?.photo_url
  const isFriend = !!friend
  const sinceDate = friend?.created_at ? new Date(friend.created_at).toLocaleDateString() : null

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center" role="dialog" aria-modal="true">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

      {/* sheet */}
      <div
        className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)]
                   rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop
                   h-auto max-h-[90vh] flex flex-col"
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">
            {t("contacts")}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--tg-accent-color)]/10" aria-label={t("close")}>
            <X className="w-5 h-5 text-[var(--tg-hint-color)]" />
          </button>
        </div>

        {/* content */}
        <div className="p-2">
          <CardSection>
            {loading && (
              <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("loading")}</div>
            )}
            {!!error && !loading && (
              <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("error")}</div>
            )}

            {!loading && !error && (
              <>
                <UserCard name={displayName} username={username || undefined} photo_url={photo || undefined} />

                {/* «В друзьях с …» — только если это мой друг */}
                {isFriend && sinceDate && (
                  <div className="px-3 pb-3 text-xs text-[var(--tg-hint-color)]">
                    {t("contact.in_friends_since")} <b>{sinceDate}</b>
                  </div>
                )}
              </>
            )}
          </CardSection>
        </div>
      </div>
    </div>
  )
}
