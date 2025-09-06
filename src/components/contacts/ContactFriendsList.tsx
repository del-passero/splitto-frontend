// src/components/contacts/ContactFriendsList.tsx

import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useFriendsStore } from "../../store/friendsStore"
import UserCard from "../UserCard"
import type { Friend, UserShort } from "../../types/friend"

type Props = {
  contactUserId: number
}

const PAGE_SIZE = 20

function pickPerson(f: Friend): UserShort | undefined {
  const candidates = [f.user, f.friend].filter(Boolean) as UserShort[]
  return candidates.find(u => u.id === f.friend_id) || candidates[0]
}

const ContactFriendsList = ({ contactUserId }: Props) => {
  const { t } = useTranslation()
  const {
    contactFriends, contactTotal, contactLoading, contactError,
    contactHasMore, contactPage, fetchFriendsOfUser
  } = useFriendsStore()

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetchFriendsOfUser(contactUserId, 0, PAGE_SIZE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactUserId])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && contactHasMore && !contactLoading) {
        const nextOffset = (contactPage + 1) * PAGE_SIZE
        fetchFriendsOfUser(contactUserId, nextOffset, PAGE_SIZE)
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [contactHasMore, contactLoading, contactPage, contactUserId, fetchFriendsOfUser])

  if (contactError) {
    return (
      <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">
        {t("contact.error_contact_friends")}
      </div>
    )
  }

  return (
    <div>
      {contactFriends.map((f: Friend, idx: number) => {
        const person = pickPerson(f)
        const displayName =
          person?.name ||
          `${person?.first_name || ""} ${person?.last_name || ""}`.trim() ||
          t("contact.no_name")

        return (
          <Link
            key={`${f.id}-${idx}`}
            to={`/contacts/${person?.id}`}
            className="block active:opacity-70"
          >
            <UserCard
              name={displayName}
              username={person?.username}
              photo_url={person?.photo_url}
            />
          </Link>
        )
      })}

      <div className="px-3 pb-3 text-xs text-[var(--tg-hint-color)]">
        {t("contact.shown_of_total", { shown: contactFriends.length, total: contactTotal })}
      </div>

      <div ref={sentinelRef} className="h-6" />
      {contactLoading && (
        <div className="px-3 pb-3 text-sm text-[var(--tg-hint-color)]">
          {t("contact.loading")}
        </div>
      )}
    </div>
  )
}

export default ContactFriendsList
