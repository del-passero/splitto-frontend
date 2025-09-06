// src/pages/ContactDetailsPage.tsx

import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import CardSection from "../components/CardSection"
import UserCard from "../components/UserCard"
import { useFriendsStore } from "../store/friendsStore"
import ContactFriendsList from "../components/contacts/ContactFriendsList"
import type { UserShort } from "../types/friend"
import type { User } from "../types/user"

const ContactDetailsPage = () => {
  const { t } = useTranslation()
  const { friendId: friendIdParam } = useParams()
  const friendId = Number(friendIdParam)

  const {
    contactFriend, contactFriendLoading, contactFriendError, fetchFriendById,
    contactCommonGroupNames, contactCommonGroupsLoading, contactCommonGroupsError, fetchCommonGroupNames,
    contactUserFallback, clearContactFriends,
  } = useFriendsStore()

  const [activeTab, setActiveTab] = useState<"info" | "friends">("info")

  // Смена профиля — очищаем и грузим заново
  useEffect(() => {
    clearContactFriends()
    if (Number.isFinite(friendId)) {
      fetchFriendById(friendId)
      fetchCommonGroupNames(friendId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId])

  // user из FriendOut (если это мой друг)
  const userFromFriendOut: UserShort | null = useMemo(() => {
    if (!contactFriend) return null
    const candidates = [contactFriend.user, contactFriend.friend].filter(Boolean) as UserShort[]
    return candidates.find(u => u.id === contactFriend.friend_id) || candidates[0] || null
  }, [contactFriend])

  // фоллбек-профиль (если НЕ друг)
  const userFromFallback: User | null = contactUserFallback

  const contactUserName =
    (userFromFriendOut?.name ||
      `${userFromFriendOut?.first_name || ""} ${userFromFriendOut?.last_name || ""}`.trim() ||
      (userFromFriendOut?.username ? `@${userFromFriendOut.username}` : "")) ||
    (userFromFallback?.name ||
      `${userFromFallback?.first_name || ""} ${userFromFallback?.last_name || ""}`.trim() ||
      (userFromFallback?.username ? `@${userFromFallback.username}` : "")) ||
    ""

  const contactUsername = userFromFriendOut?.username ?? userFromFallback?.username
  const contactPhoto = userFromFriendOut?.photo_url ?? userFromFallback?.photo_url

  const isFriend = !!contactFriend // наличие FriendOut => это мой друг

  const onOpenProfile = () => {
    if (!contactUsername) return
    window.open(`https://t.me/${contactUsername}`, "_blank")
  }

  return (
    <div className="p-2">
      <div className="flex rounded-xl overflow-hidden mb-2 border border-[color:var(--tg-separator-color)]">
        <button
          className={`flex-1 py-2 text-sm ${activeTab === "info" ? "bg-[var(--tg-accent-color)] text-white" : "bg-[var(--tg-card-bg)] text-[var(--tg-text-color)]"}`}
          onClick={() => setActiveTab("info")}
        >
          {t("contact.tab_info")}
        </button>
        <button
          className={`flex-1 py-2 text-sm ${activeTab === "friends" ? "bg-[var(--tg-accent-color)] text-white" : "bg-[var(--tg-card-bg)] text-[var(--tg-text-color)]"}`}
          onClick={() => setActiveTab("friends")}
        >
          {t("contact.tab_contact_friends")}
        </button>
      </div>

      {activeTab === "info" && (
        <>
          <CardSection>
            {contactFriendLoading && (
              <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("loading")}</div>
            )}
            {!!contactFriendError && !userFromFallback && (
              <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("error")}</div>
            )}

            {(userFromFriendOut || userFromFallback) && (
              <div className="cursor-default">
                <UserCard
                  name={contactUserName}
                  username={contactUsername}
                  photo_url={contactPhoto}
                />

                {/* «В друзьях с …» показываем ТОЛЬКО если это мой друг */}
                {isFriend && contactFriend?.created_at && (
                  <div className="px-3 pb-3 text-xs text-[var(--tg-hint-color)]">
                    {t("contact.in_friends_since")}{" "}
                    <b>{new Date(contactFriend.created_at).toLocaleDateString()}</b>
                  </div>
                )}

                {contactUsername && (
                  <div className="px-3 pb-3">
                    <button
                      className="w-full py-2 rounded-lg bg-[var(--tg-button-color)] text-[var(--tg-button-text-color)]"
                      onClick={onOpenProfile}
                    >
                      {t("contact.open_in_telegram")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardSection>

          <CardSection noPadding>
            <div className="px-3 pt-3 pb-2 font-semibold">{t("contact.mutual_groups")}</div>

            {contactCommonGroupsLoading && (
              <div className="px-3 pb-3 text-sm text-[var(--tg-hint-color)]">{t("loading")}</div>
            )}
            {!!contactCommonGroupsError && (
              <div className="px-3 pb-3 text-sm text-[var(--tg-hint-color)]">{t("error")}</div>
            )}

            {!contactCommonGroupsLoading && !contactCommonGroupNames.length && (
              <div className="px-3 pb-3 text-sm text-[var(--tg-hint-color)]">{t("groups_not_found")}</div>
            )}

            {!!contactCommonGroupNames.length && (
              <div>
                {contactCommonGroupNames.map((name, idx) => (
                  <div key={`${name}-${idx}`} className="cursor-default">
                    {/* псевдокарточка, как просили: используем UserCard с name */}
                    <UserCard name={name} />
                  </div>
                ))}
                <div className="h-2" />
              </div>
            )}
          </CardSection>
        </>
      )}

      {activeTab === "friends" && Number.isFinite(friendId) && (
        <ContactFriendsList contactUserId={friendId} />
      )}
    </div>
  )
}

export default ContactDetailsPage

