// frontend/src/App.tsx
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

import MainLayout from "./layouts/MainLayout"
import { useApplyTheme } from "./hooks/useApplyTheme"
import { useSyncI18nLanguage } from "./hooks/useSyncI18nLanguage"
import { useTelegramAuth } from "./hooks/useTelegramAuth"

import { acceptInvite as acceptFriendInvite } from "./api/friendsApi"
import { acceptGroupInvite } from "./api/groupInvitesApi" // ← ГРУППОВОЙ инвайт

const App = () => {
  useApplyTheme()
  useSyncI18nLanguage()
  useTelegramAuth()

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp

    // 1) initDataUnsafe.start_param — главный источник (всегда есть в TWA)
    const tokenFromInitData: string | null = tg?.initDataUnsafe?.start_param ?? null

    // 2) Параметры URL: поддерживаем ВСЕ варианты, встречающиеся на Android/iOS/Web
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl =
      params.get("startapp") ||
      params.get("start") ||
      params.get("tgWebAppStartParam") || // ← часто встречается в логах
      null

    const token = tokenFromInitData || tokenFromUrl
    if (!token) return

    // 3) Разводим по типу токена
    if (token.startsWith("GINV_")) {
      // ГРУППА: акцепт + авто-редирект в группу
      acceptGroupInvite(token)
        .then((res) => {
          if (res?.group_id) {
            // Жёсткий редирект — гарантируем заход на нужную страницу
            window.location.replace(`/groups/${res.group_id}`)
          }
        })
        .catch(() => {
          // молча игнорируем — токен мог быть битый/просроченный/и т.п.
        })
    } else {
      // ДРУЖБА: как и раньше
      acceptFriendInvite(token).catch(() => {})
    }
  }, [])

  return (
    <div className="app-viewport">
      <div className="app-scroll">
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/groups/:groupId" element={<GroupDetailsPage />} />
              <Route path="/groups/:groupId/settings" element={<GroupDetailsPageSettings />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/contacts/:friendId" element={<ContactDetailsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/transactions/:txId" element={<TransactionEditPage />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </div>
    </div>
  )
}
export default App
