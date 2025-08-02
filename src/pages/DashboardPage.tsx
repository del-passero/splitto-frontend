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
      icon: <Users size={28} strokeWidth={2.5} />,
      onClick: () => {}, // handleAddGroup
      ariaLabel: "Создать группу",
    },
    {
      key: "add-contact",
      icon: <UserPlus size={28} strokeWidth={2.5} />,
      onClick: () => setInviteOpen(true),
      ariaLabel: "Добавить контакт",
    },
    {
      key: "add-transaction",
      icon: <HandCoins size={28} strokeWidth={2.5} />,
      onClick: () => {}, // handleAddTransaction
      ariaLabel: "Добавить расход",
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
