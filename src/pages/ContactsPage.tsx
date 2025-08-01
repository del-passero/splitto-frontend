// src/pages/ContactsPage.tsx

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import AddContactButton from "../components/AddContactButton"
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
  const noContacts = !filteredFriends.length && !isSearching
  const notFound = !filteredFriends.length && isSearching

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen flex flex-col">
      <FiltersRow
        search={search}
        setSearch={setSearch}
        placeholderKey="search_placeholder"
      />

      {filteredFriends.length > 0 && (
        <CardSection noPadding>
          <TopInfoRow count={filteredFriends.length} labelKey="contacts_count" />
          <ContactsList friends={filteredFriends} loading={loading} error={error} />
        </CardSection>
      )}

      {!filteredFriends.length && (
        <EmptyContacts notFound={notFound} />
      )}

      {/* Кнопка “Добавить” */}
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
