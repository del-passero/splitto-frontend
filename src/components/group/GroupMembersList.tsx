import { useRef, useEffect } from "react"
import UserCard from "../UserCard"
import EmptyContacts from "../EmptyContacts"
import CardSection from "../CardSection"
import type { GroupMember } from "../../types/group_member"

type Props = {
  members: GroupMember[]
  loading?: boolean
  onRemove?: (userId: number) => void
  isOwner?: boolean
  fetchMore?: () => void
  hasMore?: boolean
}

const GroupMembersList = ({
  members,
  loading = false,
  onRemove,
  isOwner = false,
  fetchMore,
  hasMore = false,
}: Props) => {
  const loaderRef = useRef<HTMLDivElement>(null)

  // Infinity scroll
  useEffect(() => {
    if (!hasMore || loading || !loaderRef.current || !fetchMore) return
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchMore()
      }
    })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, fetchMore])

  if (!members.length && !loading) {
    return (
      <div className="w-full flex flex-col flex-1">
        <EmptyContacts />
      </div>
    )
  }

  return (
    <CardSection noPadding>
      {members.map((m, idx) => (
        <div key={m.user.id} className="relative flex items-center">
          <UserCard
            name={`${m.user.first_name ?? ""} ${m.user.last_name ?? ""}`.trim()}
            username={m.user.username}
            photo_url={m.user.photo_url}
          />
          {isOwner && onRemove && (
            <button
              className="ml-3 text-red-500 px-3 py-1 rounded-lg hover:bg-red-500/10 transition"
              onClick={() => onRemove(m.user.id)}
              type="button"
              aria-label="Удалить участника"
            >
              ✕
            </button>
          )}
          {idx !== members.length - 1 && (
            <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
          )}
        </div>
      ))}
      {/* Loader для infinity scroll */}
      {hasMore && !loading && <div ref={loaderRef} className="w-full h-2" />}
      {loading && (
        <div className="py-3 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
      )}
    </CardSection>
  )
}

export default GroupMembersList
