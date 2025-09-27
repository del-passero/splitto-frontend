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

// ⬇️ новый экран посадки инвайта
import InviteLandingPage from "./pages/InviteLandingPage"

import MainLayout from "./layouts/MainLayout"
import { useApplyTheme } from "./hooks/useApplyTheme"
import { useSyncI18nLanguage } from "./hooks/useSyncI18nLanguage"
import { useTelegramAuth } from "./hooks/useTelegramAuth"

import { acceptInvite as acceptFriendInvite } from "./api/friendsApi"

// Небольшая нормализация токена: убираем возможные префиксы
function normalizeStartParam(raw: string | null | undefined): string | null {
  if (!raw) return null
  let t = String(raw).trim()
  if (t.startsWith("join:")) t = t.slice(5)
  if (t.startsWith("JOIN:")) t = t.slice(5)
  if (t.startsWith("g:")) t = t.slice(2)
  if (t.startsWith("G:")) t = t.slice(2)
  return t || null
}

/** Вспомогательный компонент, работает ВНУТРИ Router. Делает редирект на /invite при наличии start_param. */
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

    // Уже на странице группы — ничего не делаем
    const path = window.location.pathname
    const alreadyOnInvite = path === "/invite"
    const alreadyInGroup = /^\/groups\/\d+/.test(path)

    if (token && !alreadyOnInvite && !alreadyInGroup) {
      // replace, чтобы «назад» не вёл на Главную
      navigate("/invite", { replace: true })
    }
  }, [navigate])

  return null
}

const App = () => {
  useApplyTheme()
  useSyncI18nLanguage()
  useTelegramAuth()

  // Тихий фолбэк: если токен оказался дружеским — попробуем принять дружбу (без редиректов).
  const handledStartParamRef = useRef(false)
  useEffect(() => {
    if (handledStartParamRef.current) return
    handledStartParamRef.current = true

    const tg = (window as any)?.Telegram?.WebApp
    const fromInitData: string | null = tg?.initDataUnsafe?.start_param ?? null
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get("startapp") || params.get("start") || params.get("tgWebAppStartParam") || null
    const token = normalizeStartParam(fromInitData || fromUrl)
    if (!token) return

    ;(async () => {
      try {
        await acceptFriendInvite(token)
      } catch {
        // не дружеский — просто игнорируем
      }
    })()
  }, [])

  return (
    <div className="app-viewport">
      <div className="app-scroll">
        <BrowserRouter>
          {/* ⬇️ обработчик deep-link внутри Router */}
          <DeepLinkRouter />
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/invite" element={<InviteLandingPage />} /> {/* ⬅️ новый роут */}
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
