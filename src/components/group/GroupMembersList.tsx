// src/components/group/GroupMembersList.tsx

import { useRef, useEffect, useMemo } from "react"
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
  /** Новый: точный владелец группы */
  ownerId?: number
}

const GroupMembersList = ({
  members,
  loading = false,
  onRemove,
  isOwner = false,
  fetchMore,
  hasMore = false,
  ownerId,
}: Props) => {
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore || loading || !loaderRef.current || !fetchMore) return
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) fetchMore()
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

  // Владелец первым, остальные по алфавиту
  const sorted = useMemo(() => {
    if (!members || members.length === 0) return members
    const collator = new Intl.Collator(undefined, { sensitivity: "base" })
    const key = (m: GroupMember) => {
      const n = `${m.user?.first_name ?? ""} ${m.user?.last_name ?? ""}`.trim()
      return n || m.user?.username || String(m.user?.id ?? "")
    }
    let ownerIdx = -1
    if (typeof ownerId === "number") {
      ownerIdx = members.findIndex(m => Number(m.user?.id) === Number(ownerId))
    }
    if (ownerIdx < 0) {
      return [...members].sort((a, b) => collator.compare(key(a), key(b)))
    }
    const owner = members[ownerIdx]
    const rest = members.filter((_, i) => i !== ownerIdx).sort((a, b) => collator.compare(key(a), key(b)))
    return [owner, ...rest]
  }, [members, ownerId])

  return (
    <CardSection noPadding>
      {sorted.map((m, idx) => (
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
          {idx !== sorted.length - 1 && (
            <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
          )}
        </div>
      ))}
      {hasMore && !loading && <div ref={loaderRef} className="w-full h-2" />}
      {loading && <div className="py-3 text-center text-[var(--tg-hint-color)]">Загрузка...</div>}
    </CardSection>
  )
}

export default GroupMembersList
