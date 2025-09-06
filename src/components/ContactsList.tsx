// src/components/ContactsList.tsx
import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useFriendsStore } from "../store/friendsStore"
import UserCard from "./UserCard"

const PAGE_SIZE = 20

type Props = {
  // оставляем для совместимости с вызовом в ContactsPage.tsx
  isSearching?: boolean
  searchQuery?: string
}

const ContactsList = (_props: Props) => {
  const { t } = useTranslation()
  const { friends, total, loading, error, hasMore, page, fetchFriends } = useFriendsStore()
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
        const nextOffset = (page + 1) * PAGE_SIZE
        fetchFriends(nextOffset, PAGE_SIZE)
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, page, fetchFriends])

  if (error) {
    return <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("contacts.error_friends_list")}</div>
  }

  return (
    <div>
      {friends.map((f, idx) => {
        // IMPORTANT: в общем списке «друг» должен быть в f.friend
        const person = f.friend
        const displayName =
          person.name ||
          `${person.first_name || ""} ${person.last_name || ""}`.trim() ||
          t("contacts.no_name")
        return (
          <Link
            key={`${f.id}-${idx}`}
            to={`/contacts/${person.id}`}
            className="block active:opacity-70"
          >
            <UserCard
              name={displayName}
              username={person.username}
              photo_url={person.photo_url}
            />
          </Link>
        )
      })}

      <div className="px-3 pb-3 text-xs text-[var(--tg-hint-color)]">
        {t("contacts.shown_of_total", { shown: friends.length, total })}
      </div>

      <div ref={sentinelRef} className="h-6" />
      {loading && (
        <div className="px-3 pb-3 text-sm text-[var(--tg-hint-color)]">{t("contacts.loading")}</div>
      )}
    </div>
  )
}

export default ContactsList
