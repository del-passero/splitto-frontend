// src/pages/ContactsPage.tsx

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import MainLayout from "../layouts/MainLayout"
import { UserPlus, HandCoins } from "lucide-react"
import InviteFriendModal from "../components/InviteFriendModal"
import FiltersRow from "../components/FiltersRow"
import ContactsList from "../components/ContactsList"
import EmptyContacts from "../components/EmptyContacts"
import { useFriendsStore } from "../store/friendsStore"
import CreateTransactionModal from "../components/transactions/CreateTransactionModal"
import { useGroupsStore } from "../store/groupsStore"

const ContactsPage = () => {
  const { t } = useTranslation()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { friends, loading, error, fetchFriends, searchFriends, clearFriends } = useFriendsStore()
  const { groups } = useGroupsStore()

  // ��������� ������� ������ ��� �����
  useEffect(() => {
    clearFriends() // ������ ���������� ���� ��� ������/����� ������
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
      onClick: () => setCreateTxOpen(true),
      ariaLabel: t("add_transaction"),
      label: t("add_transaction"),
    },
  ]

  // ������ ��������� � ��� �� �������� �����
  const isSearching = search.trim().length > 0
  const nothingLoaded = !loading && !error && friends.length === 0
  const notFound = isSearching && nothingLoaded
  const noContacts = !isSearching && nothingLoaded

  if (noContacts || notFound) {
    return (
      <MainLayout fabActions={fabActions}>
        {/* ������, ����� */}
        <FiltersRow
          search={search}
          setSearch={setSearch}
          placeholderKey="search_placeholder"
        />

        {/* ������������ ������� ��������� */}
        <EmptyContacts notFound={notFound} />

        {/* ������� ����������� */}
        <InviteFriendModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          inviteLink={null}
        />

        {/* ������� �������� ���������� */}
        <CreateTransactionModal
          open={createTxOpen}
          onOpenChange={setCreateTxOpen}
          groups={(groups ?? []).map((g: any) => ({
            id: g.id,
            name: g.name,
            icon: g.icon,
            color: g.color,
          }))}
        />
      </MainLayout>
    )
  }

  return (
    <MainLayout fabActions={fabActions}>
      {/* ������, ����� */}
      <FiltersRow
        search={search}
        setSearch={setSearch}
        placeholderKey="search_placeholder"
      />

      {/* ������ ��������� (������������ � � �����, � ������� �����) */}
      <ContactsList
        isSearching={isSearching}
        searchQuery={isSearching ? search : undefined}
      />

      {/* ������� ����������� */}
      <InviteFriendModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        inviteLink={null}
      />

      {/* ������� �������� ���������� */}
      <CreateTransactionModal
        open={createTxOpen}
        onOpenChange={setCreateTxOpen}
        groups={(groups ?? []).map((g: any) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          color: g.color,
        }))}
      />
    </MainLayout>
  )
}

export default ContactsPage
