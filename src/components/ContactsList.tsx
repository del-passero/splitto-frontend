import { useEffect, useRef } from "react"
import UserCard from "./UserCard"
import EmptyContacts from "./EmptyContacts"
import CardSection from "./CardSection"
import { useFriendsStore } from "../store/friendsStore"

type Props = {
  isSearching?: boolean
  searchQuery?: string | null
}

const PAGE_SIZE = 20

const ContactsList = ({ isSearching = false, searchQuery }: Props) => {
  const {
    friends,
    total,
    loading,
    error,
    fetchFriends,
    searchFriends,
    clearFriends,
    hasMore,
    page,
    setPage
  } = useFriendsStore()

  const loaderRef = useRef<HTMLDivElement>(null)

  // Сброс и загрузка первой страницы при смене режима или поискового запроса
  useEffect(() => {
    clearFriends()
    setPage(0)
    if (isSearching && searchQuery) {
      searchFriends(searchQuery, 0, PAGE_SIZE)
    } else {
      fetchFriends(0, PAGE_SIZE)
    }
    // eslint-disable-next-line
  }, [isSearching, searchQuery])

  // Infinity scroll
  useEffect(() => {
    if (loading || !hasMore || !loaderRef.current) return

    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        const nextPage = page + 1
        setPage(nextPage)
        if (isSearching && searchQuery) {
          searchFriends(searchQuery, nextPage * PAGE_SIZE, PAGE_SIZE)
        } else {
          fetchFriends(nextPage * PAGE_SIZE, PAGE_SIZE)
        }
      }
    })
    observer.observe(loaderRef.current)

    return () => observer.disconnect()
  }, [loading, hasMore, isSearching, searchQuery, fetchFriends, searchFriends, page, setPage])

  // Пустой список (нет друзей и загрузка завершена)
  if (!friends.length && !loading) {
    return (
      <div className="w-full flex flex-col flex-1">
        <EmptyContacts notFound={isSearching} />
      </div>
    )
  }

  // Ошибка
  if (error) {
    return (
      <CardSection>
        <div className="py-12 text-center text-red-500">{error}</div>
      </CardSection>
    )
  }

  // Лоадер при первой загрузке
  if (loading && friends.length === 0) {
    return (
      <CardSection>
        <div className="py-12 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
      </CardSection>
    )
  }

  // Основной список
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
      {hasMore && (
        <div ref={loaderRef} style={{ height: 1, width: "100%" }} />
      )}
      {loading && friends.length > 0 && (
        <div className="py-3 text-center text-[var(--tg-hint-color)]">Загрузка...</div>
      )}
    </CardSection>
  )
}

export default ContactsList
