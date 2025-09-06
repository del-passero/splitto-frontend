// src/components/contacts/ContactFriendsList.tsx

import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useFriendsStore } from "../../store/friendsStore"
import UserCard from "../UserCard"
import CardSection from "../CardSection"
import type { Friend, UserShort } from "../../types/friend"

type Props = {
  contactUserId: number
  /** чтобы по клику на себя открывать /profile */
  currentUserId?: number
}

const PAGE_SIZE = 20

function pickPerson(f: Friend): UserShort | undefined {
  const c = [f.user, f.friend].filter(Boolean) as UserShort[]
  return c.find(u => u.id === f.friend_id) || c[0]
}

const ContactFriendsList = ({ contactUserId, currentUserId }: Props) => {
  const { t } = useTranslation()
  const {
    contactFriends, contactLoading, contactError,
    contactHasMore, fetchFriendsOfUser
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
        const nextOffset = contactFriends.length
        fetchFriendsOfUser(contactUserId, nextOffset, PAGE_SIZE)
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [contactHasMore, contactLoading, contactFriends.length, contactUserId, fetchFriendsOfUser])

  return (
    <CardSection noPadding>
      {!!contactError && (
        <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">
          {t("error")}
        </div>
      )}

      {contactFriends.map((f: Friend, idx: number) => {
        const person = pickPerson(f)
        const displayName =
          person?.name ||
          `${person?.first_name || ""} ${person?.last_name || ""}`.trim() ||
          (person?.username ? `@${person.username}` : "")

        const toHref = person?.id === currentUserId ? "/profile" : `/contacts/${person?.id}`

        return (
          <div key={`${f.id}-${idx}`} className="relative">
            <Link to={toHref} className="block active:opacity-70">
              <UserCard
                name={displayName}
                username={person?.username}
                photo_url={person?.photo_url}
              />
            </Link>

            {/* разделитель как раньше: с отступом под аватар и без «дыры» справа */}
            {idx !== contactFriends.length - 1 && (
              <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
            )}
          </div>
        )
      })}

      {/* компактный якорь — без лишнего пустого места */}
      <div ref={sentinelRef} className="h-px" />
      {contactLoading && (
        <div className="px-3 py-2 text-sm text-[var(--tg-hint-color)]">
          {t("loading")}
        </div>
      )}
    </CardSection>
  )
}

export default ContactFriendsList
