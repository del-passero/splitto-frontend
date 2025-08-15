// src/pages/DashboardPage.tsx
// Подключена CreateTransactionModal без t/locale пропсов — i18n внутри модалки.

import { useState } from "react"
import { useTranslation } from "react-i18next"
import MainLayout from "../layouts/MainLayout"
import { Users, UserPlus, HandCoins } from "lucide-react"
import InviteFriendModal from "../components/InviteFriendModal"
import CreateGroupModal from "../components/CreateGroupModal"
import { useUserStore } from "../store/userStore"
import { useGroupsStore } from "../store/groupsStore"
import CreateTransactionModal from "../components/transactions/CreateTransactionModal"

const DashboardPage = () => {
  const { t } = useTranslation()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)

  const user = useUserStore(state => state.user)
  const { fetchGroups, groups } = useGroupsStore()

  const handleGroupCreated = () => {
    setCreateGroupOpen(false)
    if (user?.id) fetchGroups(user.id)
  }

  const fabActions = [
    {
      key: "add-group",
      icon: <Users size={28} strokeWidth={1.5} />,
      onClick: () => setCreateGroupOpen(true),
      ariaLabel: t("create_group"),
      label: t("create_group"),
    },
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

  return (
    <MainLayout fabActions={fabActions}>
      <div className="w-full max-w-md mx-auto py-6">
        <h1 className="text-xl font-bold mb-4">{t("main")}</h1>
      </div>

      <InviteFriendModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        inviteLink={null}
      />

      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        ownerId={user?.id ?? 0}
        onCreated={handleGroupCreated}
      />

      <CreateTransactionModal
        open={createTxOpen}
        onOpenChange={setCreateTxOpen}
        groups={(groups ?? []).map((g: any) => ({ id: g.id, name: g.name, icon: g.icon, color: g.color }))}
      />
    </MainLayout>
  )
}

export default DashboardPage
