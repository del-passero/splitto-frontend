// src/pages/DashboardPage.tsx

import { useState } from "react"
import { useTranslation } from "react-i18next"
import MainLayout from "../layouts/MainLayout"
import { Users, UserPlus, HandCoins } from "lucide-react"
import InviteFriendModal from "../components/InviteFriendModal"

const DashboardPage = () => {
  const { t } = useTranslation()
  const [inviteOpen, setInviteOpen] = useState(false)

  const fabActions = [
    {
      key: "add-group",
      icon: <Users size={28} strokeWidth={1.5} />,
      onClick: () => {}, // handleAddGroup
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
      onClick: () => {}, // handleAddTransaction
      ariaLabel: t("add_transaction"),
      label: t("add_transaction"),
    },
  ]

  return (
    <MainLayout fabActions={fabActions}>
      <div className="w-full max-w-md mx-auto py-6">
        <h1 className="text-xl font-bold mb-4">{t("main")}</h1>
        {/* Контент дашборда */}
      </div>
      <InviteFriendModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        inviteLink={null}
      />
    </MainLayout>
  )
}

export default DashboardPage
