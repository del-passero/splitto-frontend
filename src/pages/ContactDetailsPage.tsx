// src/pages/ContactDetailsPage.tsx

import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import CardSection from "../components/CardSection"
import UserCard from "../components/UserCard"
import { useFriendsStore } from "../store/friendsStore"
import ContactFriendsList from "../components/contacts/ContactFriendsList"

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

  useEffect(() => {
    if (!Number.isFinite(friendId)) return
    fetchFriendById(friendId)
    fetchCommonGroupNames(friendId)
    return () => { clearContactFriends() }
  }, [friendId, fetchFriendById, fetchCommonGroupNames, clearContactFriends])

  const contactUser = useMemo(() => {
    if (!contactFriend) return null
    return contactFriend.friend
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
          {t("contacts.tab_info")}
        </button>
        <button
          className={`flex-1 py-2 text-sm ${activeTab === "friends" ? "bg-[var(--tg-accent-color)] text-white" : "bg-[var(--tg-card-bg)] text-[var(--tg-text-color)]"}`}
          onClick={() => setActiveTab("friends")}
        >
          {t("contacts.tab_contact_friends")}
        </button>
      </div>

      {activeTab === "info" && (
        <>
          <CardSection>
            {contactFriendLoading && <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("contacts.loading")}</div>}
            {contactFriendError && <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("contacts.error_contact")}</div>}
            {contactUser && (
              <div className="cursor-default">
                <UserCard
                  name={contactUser.name || `${contactUser.first_name || ""} ${contactUser.last_name || ""}`.trim() || t("contacts.no_name")}
                  username={contactUser.username}
                  photo_url={contactUser.photo_url}
                />
                <div className="px-3 pb-3 text-xs text-[var(--tg-hint-color)]">
                  {t("contacts.in_friends_since")}{" "}
                  <b>{new Date(contactFriend!.created_at).toLocaleDateString()}</b>
                </div>
                {contactUser.username && (
                  <div className="px-3 pb-3">
                    <button
                      className="w-full py-2 rounded-lg bg-[var(--tg-button-color)] text-[var(--tg-button-text-color)]"
                      onClick={onOpenProfile}
                    >
                      {t("contacts.open_in_telegram")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardSection>

          <CardSection>
            <div className="px-3 py-2 font-semibold">{t("contacts.mutual_groups")}</div>
            {contactCommonGroupsLoading && <div className="px-3 pb-3 text-sm text-[var(--tg-hint-color)]">{t("contacts.loading")}</div>}
            {contactCommonGroupsError && <div className="px-3 pb-3 text-sm text-[var(--tg-hint-color)]">{t("contacts.error_common_groups")}</div>}
            {!contactCommonGroupsLoading && !contactCommonGroupNames.length && (
              <div className="px-3 pb-3 text-sm text-[var(--tg-hint-color)]">{t("contacts.no_common_groups")}</div>
            )}
            {!!contactCommonGroupNames.length && (
              <ul className="px-3 pb-2">
                {contactCommonGroupNames.map((name, idx) => (
                  <li key={`${name}-${idx}`} className="py-1 text-sm truncate">
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </CardSection>
        </>
      )}

      {activeTab === "friends" && contactUser?.id && (
        <CardSection noPadding>
          <ContactFriendsList contactUserId={contactUser.id} />
        </CardSection>
      )}
    </div>
  )
}

export default ContactDetailsPage
