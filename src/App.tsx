import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useEffect } from "react"

import DashboardPage from "./pages/DashboardPage"
import GroupsPage from "./pages/GroupsPage"
import GroupDetailsPage from "./pages/GroupDetailsPage"
import GroupDetailsPageSettings from "./pages/GroupDetailsPageSettings"
import ContactsPage from "./pages/ContactsPage"
import ProfilePage from "./pages/ProfilePage"
import TransactionEditPage from "./pages/TransactionEditPage"
import ContactDetailsPage from "./pages/ContactDetailsPage"
import InvitePage from "./pages/InvitePage"

import MainLayout from "./layouts/MainLayout"
import { useApplyTheme } from "./hooks/useApplyTheme"
import { useSyncI18nLanguage } from "./hooks/useSyncI18nLanguage"
import { useTelegramAuth } from "./hooks/useTelegramAuth"
import { useAcceptInviteOnBoot } from "./hooks/useAcceptInviteOnBoot"

// ВАЖНО: этот компонент живёт ВНУТРИ <BrowserRouter>, поэтому хуки роутера здесь валидны
const RoutedApp = () => {
  useAcceptInviteOnBoot()

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:groupId" element={<GroupDetailsPage />} />
        <Route path="/groups/:groupId/settings" element={<GroupDetailsPageSettings />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/:friendId" element={<ContactDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/transactions/:txId" element={<TransactionEditPage />} />
      </Routes>
    </MainLayout>
  )
}

const App = () => {
  useApplyTheme()
  useSyncI18nLanguage()
  useTelegramAuth()

  useEffect(() => {
    // Telegram WebApp init происходит в useTelegramAuth
  }, [])

  return (
    <div className="app-viewport">
      <div className="app-scroll">
        <BrowserRouter>
          <RoutedApp />
        </BrowserRouter>
      </div>
    </div>
  )
}

export default App
