// src/pages/ContactsPage.tsx

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import MainLayout from "../layouts/MainLayout"
import { UserPlus, HandCoins } from "lucide-react"
import InviteFriendModal from "../components/InviteFriendModal"
import FiltersRow from "../components/FiltersRow"
import TopInfoRow from "../components/TopInfoRow"
import ContactsList from "../components/ContactsList"
import EmptyContacts from "../components/EmptyContacts"
import CardSection from "../components/CardSection"
import { useFriendsStore } from "../store/friendsStore"

const ContactsPage = () => {
  const { t } = useTranslation()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { friends, loading, error, fetchFriends } = useFriendsStore()

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  const filteredFriends = friends.filter(friend =>
    friend.user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    friend.user.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    friend.user.username?.toLowerCase().includes(search.toLowerCase())
  )

  const isSearching = search.length > 0
  const notFound = !filteredFriends.length && isSearching

  // Можно добавить другие actions (например, транзакция)
  const fabActions = [
  {
    key: "add-contact",
    icon: <UserPlus size={28} strokeWidth={2.5} />,
    onClick: () => setInviteOpen(true),
    ariaLabel: "Пригласить друга",
  },
  {
    key: "add-transaction",
    icon: <HandCoins size={28} strokeWidth={2.5} />,
    onClick: () => {}, // пока ничего не делает
    ariaLabel: "Добавить расход",
  },
]
  
  return (
    <MainLayout fabActions={fabActions}>
      {/* Фильтр, поиск */}
      <FiltersRow
        search={search}
        setSearch={setSearch}
        placeholderKey="search_placeholder"
      />

      {/* Если есть друзья — список и информер */}
      {filteredFriends.length > 0 && (
        <CardSection noPadding>
          <TopInfoRow count={filteredFriends.length} labelKey="contacts_count" />
          <ContactsList friends={filteredFriends} loading={loading} error={error} />
        </CardSection>
      )}

      {/* Если друзей нет — заглушка */}
      {!filteredFriends.length && (
        <EmptyContacts notFound={notFound} />
      )}

      {/* Модалка приглашения */}
      <InviteFriendModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        inviteLink={null}
      />
    </MainLayout>
  )
}

export default ContactsPage
