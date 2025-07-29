// src/pages/ContactsPage.tsx

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import AddContactButton from "../components/AddContactButton"
import SearchBar from "../components/SearchBar"
import SortButton from "../components/SortButton"
import FilterButton from "../components/FilterButton"
import InviteFriendModal from "../components/InviteFriendModal"
import UserCard from "../components/UserCard"
import { useFriendsStore } from "../store/friendsStore"

const ContactsPage = () => {
  const { t } = useTranslation()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { friends, loading, error, fetchFriends } = useFriendsStore()

  // Загружаем друзей при первом рендере страницы
  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  // Фильтрация по поиску (пока простейшая)
  const filteredFriends = friends.filter(friend =>
    friend.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    friend.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    friend.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen flex flex-col">
      <header className="flex items-center justify-between mb-4 px-2 pt-6">
        <h1 className="text-xl font-bold">{t("contacts")}</h1>
      </header>

      <div className="flex items-center gap-2 mb-4 px-2">
        <FilterButton onClick={() => {}} />
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder={t("search_placeholder") || "Поиск..."} />
        </div>
        <SortButton onClick={() => {}} />
      </div>

      <div className="mb-2 px-2 text-xs text-[var(--tg-hint-color)]">
        {t("contacts_count", { count: filteredFriends.length })}
      </div>

      <div className="flex-1 flex flex-col gap-2 px-2">
        {loading && <div>{t("loading")}</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && filteredFriends.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center text-[var(--tg-hint-color)] text-lg">
            {t("empty_contacts")}
          </div>
        )}
        {/* Отображаем друзей */}
        {filteredFriends.map(friend => (
          <UserCard
            key={friend.id}
            name={`${friend.first_name ?? ""} ${friend.last_name ?? ""}`.trim()}
            username={friend.username}
            photo_url={friend.photo_url}
          />
        ))}
      </div>

      {/* FAB и подпись */}
      <div className="absolute right-6 bottom-[90px] flex flex-col items-center z-40">
        <AddContactButton onClick={() => setInviteOpen(true)} />
        <span className="mt-1 text-xs font-medium text-[var(--tg-hint-color)] select-none">
          {t("invite_friend")}
        </span>
      </div>

      {/* Модалка инвайта */}
      <InviteFriendModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        inviteLink={null}
      />
    </div>
  )
}

export default ContactsPage
