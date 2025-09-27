// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useEffect, useRef } from "react"

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
// ⬇️ Больше НЕ импортируем group accept, т.к. теперь это делает модалка
// import { acceptGroupInvite } from "./api/groupInvitesApi"

// ✅ Подключаем модалку приглашения в группу
import InviteJoinModal from "./components/InviteJoinModal"

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

const App = () => {
  useApplyTheme()
  useSyncI18nLanguage()
  useTelegramAuth()

  // предохранитель от двойного вызова useEffect (StrictMode/dev/ре-рендеры)
  const handledStartParamRef = useRef(false)

  useEffect(() => {
    if (handledStartParamRef.current) return
    handledStartParamRef.current = true

    const tg = (window as any)?.Telegram?.WebApp

    // 1) берём start_param из WebApp
    const fromInitData: string | null = tg?.initDataUnsafe?.start_param ?? null

    // 2) а также все известные вариации в URL (Android/iOS/Web)
    const params = new URLSearchParams(window.location.search)
    const fromUrl =
      params.get("startapp") ||
      params.get("start") ||
      params.get("tgWebAppStartParam") ||
      null

    const token = normalizeStartParam(fromInitData || fromUrl)
    if (!token) return

    // ❗ Больше НЕ принимаем групповой инвайт здесь — это делает InviteJoinModal
    // Оставляем только тихий фолбэк для дружеского инвайта
    ;(async () => {
      try {
        await acceptFriendInvite(token)
        // без редиректов и попапов — на успех/ошибку не реагируем
      } catch {
        // молча игнорируем: это не дружеский или протухший инвайт
      }
    })()
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

            {/* ✅ Модалка приглашения в группу — рендерится поверх всего и сама решает, показываться или нет */}
            <InviteJoinModal />
          </MainLayout>
        </BrowserRouter>
      </div>
    </div>
  )
}

export default App
