// src/pages/ContactsPage.tsx

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import MainLayout from "../layouts/MainLayout"
import { UserPlus, HandCoins } from "lucide-react"
import InviteFriendModal from "../components/InviteFriendModal"
import FiltersRow from "../components/FiltersRow"
import TopInfoRow from "../components/TopInfoRow"
import ContactsList from "../components/ContactsList"
import { useFriendsStore } from "../store/friendsStore"

const ContactsPage = () => {
  const { t } = useTranslation()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { friends, total, loading, fetchFriends, searchFriends, clearFriends } = useFriendsStore()

  // ��������� ������� ������ ��� �����
  useEffect(() => {
    clearFriends()         // ������ ���������� ���� ��� ������/����� ������
    if (search.trim().length > 0) {
      searchFriends(search)
    } else {
      fetchFriends()
    }
    // eslint-disable-next-line
  }, [search])

  const fabActions = [
    {
      key: "add-contact",
      icon: <UserPlus size={28} strokeWidth={1.5} />,
      onClick: () => setInviteOpen(true),
      ariaLabel: t("invite_friend"),
      label: t("invite_friend"),
    },
    {
      key: "add-transaction",
      icon: <HandCoins size={28} strokeWidth={1.5} />,
      onClick: () => {}, // ���� ������ �� ������
      ariaLabel: t("add_transaction"),
      label: t("add_transaction"),
    },
  ]

  return (
    <MainLayout fabActions={fabActions}>
      {/* ������, ����� */}
      <FiltersRow
        search={search}
        setSearch={setSearch}
        placeholderKey="search_placeholder"
      />

      {/* �������� */}
      {friends.length > 0 && (
        <TopInfoRow count={total} labelKey="contacts_count" />
      )}

      {/* ������ ��������� (������������ � � �����, � ������� �����) */}
      <ContactsList
        isSearching={search.length > 0}
        searchQuery={search.length > 0 ? search : undefined}
      />

      {/* ������� ����������� */}
      <InviteFriendModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        inviteLink={null}
      />
    </MainLayout>
  )
}

export default ContactsPage
