// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { useEffect, useRef } from "react"

import DashboardPage from "./pages/DashboardPage"
import GroupsPage from "./pages/GroupsPage"
import GroupDetailsPage from "./pages/GroupDetailsPage"
import GroupDetailsPageSettings from "./pages/GroupDetailsPageSettings"
import ContactsPage from "./pages/ContactsPage"
import ProfilePage from "./pages/ProfilePage"
import TransactionEditPage from "./pages/TransactionEditPage"
import ContactDetailsPage from "./pages/ContactDetailsPage"
import InviteLandingPage from "./pages/InviteLandingPage"

import MainLayout from "./layouts/MainLayout"
import { useApplyTheme } from "./hooks/useApplyTheme"
import { useSyncI18nLanguage } from "./hooks/useSyncI18nLanguage"
import { useTelegramAuth } from "./hooks/useTelegramAuth"

// Убрали автопринятие группового инвайта из App (делает модалка/страница).
// Также не трогаем "friends" тут, чтобы не сыпались 404.

function normalizeStartParam(raw: string | null | undefined): string | null {
  if (!raw) return null
  let t = String(raw).trim()
  if (t.startsWith("join:")) t = t.slice(5)
  if (t.startsWith("JOIN:")) t = t.slice(5)
  if (t.startsWith("g:")) t = t.slice(2)
  if (t.startsWith("G:")) t = t.slice(2)
  return t || null
}

/** Вспомогательный компонент: если есть start_param — переводим на /invite. */
function DeepLinkRouter() {
  const navigate = useNavigate()
  const onceRef = useRef(false)

  useEffect(() => {
    if (onceRef.current) return
    onceRef.current = true

    const tg = (window as any)?.Telegram?.WebApp
    const fromInitData: string | null = tg?.initDataUnsafe?.start_param ?? null
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get("startapp") || params.get("start") || params.get("tgWebAppStartParam") || null
    const token = normalizeStartParam(fromInitData || fromUrl)

    const path = window.location.pathname
    const alreadyOnInvite = path === "/invite"
    const alreadyInGroup = /^\/groups\/\d+/.test(path)

    if (token && !alreadyOnInvite && !alreadyInGroup) {
      navigate("/invite", { replace: true })
    }
  }, [navigate])

  return null
}

const App = () => {
  useApplyTheme()
  useSyncI18nLanguage()
  useTelegramAuth()

  return (
    <div className="app-viewport">
      <div className="app-scroll">
        <BrowserRouter>
          <DeepLinkRouter />
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/invite" element={<InviteLandingPage />} />
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
