// src/pages/ContactDetailsPage.tsx

import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import CardSection from "../components/CardSection"
import UserCard from "../components/UserCard"
import { useFriendsStore } from "../store/friendsStore"
import ContactFriendsList from "../components/contacts/ContactFriendsList"
import type { UserShort } from "../types/friend"

const ContactDetailsPage = () => {
  const { t } = useTranslation()
  const { friendId: friendIdParam } = useParams()
  const friendId = Number(friendIdParam)

  const {
    contactFriend, contactFriendLoading, contactFriendError, fetchFriendById,
    contactCommonGroupNames, contactCommonGroupsLoading, contactCommonGroupsError, fetchCommonGroupNames,
    clearContactFriends
  } = useFriendsStore()

  const [activeTab, setActiveTab] = useState<"info" | "friends">("info")

  // при смене friendId — чистим контактные данные до новой загрузки
  useEffect(() => {
    clearContactFriends()
    if (Number.isFinite(friendId)) {
      fetchFriendById(friendId)
      fetchCommonGroupNames(friendId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId])

  const contactUser: UserShort | null = useMemo(() => {
    if (!contactFriend) return null
    const c = [contactFriend.user, contactFriend.friend].filter(Boolean) as UserShort[]
    return c.find(u => u.id === contactFriend.friend_id) || c[0] || null
  }, [contactFriend])

  const onOpenProfile = () => {
    if (!contactUser?.username) return
    window.open(`https://t.me/${contactUser.username}`, "_blank")
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
            {contactFriendLoading && <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("loading")}</div>}
            {!!contactFriendError && <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("error")}</div>}
            {contactUser && (
              <div className="cursor-default">
                <UserCard
                  name={contactUser.name || `${contactUser.first_name || ""} ${contactUser.last_name || ""}`.trim() || (contactUser.username ? `@${contactUser.username}` : "")}
                  username={contactUser.username}
                  photo_url={contactUser.photo_url}
                />
                <div className="px-3 pb-3 text-xs text-[var(--tg-hint-color)]">
                  {t("contact.in_friends_since")}{" "}
                  <b>{contactFriend?.created_at ? new Date(contactFriend.created_at).toLocaleDateString() : ""}</b>
                </div>
                {contactUser.username && (
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
                    <UserCard name={name} />
                  </div>
                ))}
                <div className="h-2" />
              </div>
            )}
          </CardSection>
        </>
      )}

      {activeTab === "friends" && contactUser?.id && (
        <ContactFriendsList contactUserId={Number(contactUser.id)} />
      )}
    </div>
  )
}

export default ContactDetailsPage
