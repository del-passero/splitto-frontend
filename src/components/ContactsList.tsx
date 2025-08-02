import { useState, useEffect, useRef, useCallback } from "react"
import UserCard from "./UserCard"
import EmptyContacts from "./EmptyContacts"
import CardSection from "./CardSection"
import type { Friend } from "../types/friend"
import { getFriends } from "../api/friendsApi"

type Props = {
  friends?: Friend[]
  loading?: boolean
  error?: string | null
  isSearching?: boolean
}

const PAGE_SIZE = 20

const ContactsList = ({ friends, loading, error, isSearching }: Props) => {
  const [internalFriends, setInternalFriends] = useState<Friend[]>([])
  const [internalError, setInternalError] = useState<string | null>(null)
  const [internalLoading, setInternalLoading] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)
  const observer = useRef<IntersectionObserver>()

  // Сброс стейта при монтировании/смене поиска
  useEffect(() => {
    if (typeof friends !== "undefined") return
    setInternalFriends([])
    setInternalError(null)
    setPage(0)
    setHasMore(true)
    setTotal(null)
    loadMore(0, true)
    // eslint-disable-next-line
  }, [])

  // Infinity scroll
  useEffect(() => {
    if (typeof friends !== "undefined") return
    if (internalLoading || !hasMore || !loaderRef.current) return

    observer.current?.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !internalLoading && hasMore) {
        loadMore()
      }
    })
    observer.current.observe(loaderRef.current)

    return () => observer.current?.disconnect()
    // eslint-disable-next-line
  }, [internalLoading, hasMore, loaderRef.current])

  // Лоадер для бесконечного скролла
  const loadMore = useCallback(async (_page?: number, reset?: boolean) => {
    try {
      setInternalLoading(true)
      setInternalError(null)
      const pageNum = typeof _page === "number" ? _page : page
      const res = await getFriends(false, pageNum * PAGE_SIZE, PAGE_SIZE)
      setTotal(res.total)
      if (reset) {
        setInternalFriends(res.friends)
      } else {
        setInternalFriends(prev => [...prev, ...res.friends])
      }
      setHasMore(res.friends.length === PAGE_SIZE)
      setPage(pageNum + 1)
    } catch (err: any) {
      setInternalError(err.message || "Ошибка загрузки")
    } finally {
      setInternalLoading(false)
    }
  }, [page])

  // Для режима поиска (search)
  if (typeof friends !== "undefined") {
    if (loading) {
      return (
        <CardSection>
          <div className="py-12 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
        </CardSection>
      )
    }
    if (error) {
      return (
        <CardSection>
          <div className="py-12 text-center text-red-500">{error}</div>
        </CardSection>
      )
    }
    if (!friends.length) {
      return (
        <div className="w-full flex flex-col flex-1">
          <EmptyContacts notFound={isSearching} />
        </div>
      )
    }
    return (
      <CardSection noPadding>
        {friends.map((friend, idx) => (
          <div key={friend.id} className="relative">
            <UserCard
              name={`${friend.user.first_name ?? ""} ${friend.user.last_name ?? ""}`.trim()}
              username={friend.user.username}
              photo_url={friend.user.photo_url}
            />
            {idx !== friends.length - 1 && (
              <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
            )}
          </div>
        ))}
      </CardSection>
    )
  }

  // Для бесконечного скролла
  if (internalLoading && internalFriends.length === 0) {
    return (
      <CardSection>
        <div className="py-12 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
      </CardSection>
    )
  }
  if (internalError) {
    return (
      <CardSection>
        <div className="py-12 text-center text-red-500">{internalError}</div>
      </CardSection>
    )
  }
  if (!internalFriends.length) {
    return (
      <div className="w-full flex flex-col flex-1">
        <EmptyContacts notFound={isSearching} />
      </div>
    )
  }
  return (
    <CardSection noPadding>
      {internalFriends.map((friend, idx) => (
        <div key={friend.id} className="relative">
          <UserCard
            name={`${friend.user.first_name ?? ""} ${friend.user.last_name ?? ""}`.trim()}
            username={friend.user.username}
            photo_url={friend.user.photo_url}
          />
          {idx !== internalFriends.length - 1 && (
            <div className="absolute left-16 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
          )}
        </div>
      ))}
      {hasMore && (
        <div ref={loaderRef} style={{ height: 1, width: "100%" }} />
      )}
      {internalLoading && (
        <div className="py-3 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
      )}
      {typeof total === "number" && (
        <div className="text-xs text-center text-[var(--tg-hint-color)] pb-2">
          Показано: {internalFriends.length} из {total}
        </div>
      )}
    </CardSection>
  )
}

export default ContactsList
