// src/components/ContactsList.tsx

import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useFriendsStore } from "../store/friendsStore"
import UserCard from "./UserCard"
import CardSection from "./CardSection"
import type { Friend, UserShort } from "../types/friend"

const PAGE_SIZE = 20

type Props = {
  isSearching?: boolean
  searchQuery?: string
}

function pickPerson(f: Friend): UserShort | undefined {
  const c = [f.user, f.friend].filter(Boolean) as UserShort[]
  return c.find(u => u.id === f.friend_id) || c[0]
}

const ContactsList = (_props: Props) => {
  const { t } = useTranslation()
  const { friends, loading, error, hasMore, fetchFriends } = useFriendsStore()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (friends.length === 0) {
      fetchFriends(0, PAGE_SIZE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        const nextOffset = friends.length
        fetchFriends(nextOffset, PAGE_SIZE)
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, friends.length, fetchFriends])

  return (
    <CardSection noPadding>
      {!!error && (
        <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">
          {t("error")}
        </div>
      )}

      {friends.map((f: Friend, idx: number) => {
        const person = pickPerson(f)
        const displayName =
          person?.name ||
          `${person?.first_name || ""} ${person?.last_name || ""}`.trim() ||
          (person?.username ? `@${person.username}` : "")
        return (
          <div key={`${f.id}-${idx}`} className="relative">
            <Link
              to={`/contacts/${person?.id}`}
              className="block active:opacity-70"
            >
              <UserCard
                name={displayName}
                username={person?.username}
                photo_url={person?.photo_url}
              />
            </Link>

            {/* разделитель в стиле «как раньше» */}
            {idx !== friends.length - 1 && (
              <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
            )}
          </div>
        )
      })}

      {/* компактный якорь — без пустоты снизу */}
      <div ref={sentinelRef} className="h-px" />
      {loading && (
        <div className="px-3 py-2 text-sm text-[var(--tg-hint-color)]">{t("loading")}</div>
      )}
    </CardSection>
  )
}

export default ContactsList
