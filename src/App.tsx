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
import { acceptGroupInvite } from "./api/groupInvitesApi"

/** Нормализуем токен: срезаем `join:`, убираем пробелы, добиваем base64url-паддинг */
function normalizeInviteToken(raw: string | null | undefined): string | null {
  if (!raw) return null
  let t = String(raw).trim().replace(/\s+/g, "")
  if (t.startsWith("join:")) t = t.slice(5) // убрать префикс join:
  // base64url-паддинг, если строка урл-безопасная и длина не кратна 4
  if (/^[A-Za-z0-9_-]+$/.test(t) && t.length % 4 !== 0) {
    t = t + "=".repeat((4 - (t.length % 4)) % 4)
  }
  return t
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

    // 1) берем start_param из WebApp
    const fromInitData: string | null = tg?.initDataUnsafe?.start_param ?? null

    // 2) а также все известные вариации в URL (Android/iOS/Web)
    const params = new URLSearchParams(window.location.search)
    const fromUrl =
      params.get("startapp") ||
      params.get("start") ||
      params.get("tgWebAppStartParam") ||
      null

    const tokenRaw = fromInitData || fromUrl
    const token = normalizeInviteToken(tokenRaw)
    if (!token) return

    // === ВАЖНО ===
    // Всегда пробуем принять КАК ГРУППОВОЙ инвайт.
    // Если бэк ответил bad_token / invite_not_found — это не групповой → пробуем дружбу.
    ;(async () => {
      try {
        const res = await acceptGroupInvite(token)
        if (res?.group_id) {
          // жёсткий редирект, чтобы гарантированно оказаться внутри роутера нужной группы
          window.location.replace(`/groups/${res.group_id}`)
          return
        }
        // если без group_id — просто замолчим
      } catch (e: any) {
        const msg = String(e?.message || "").toLowerCase()
        // fallback только при «не наш» групповой токен
        if (msg.includes("bad_token") || msg.includes("invite_not_found")) {
          try {
            await acceptFriendInvite(token)
          } catch {
            // молча игнорируем: это «чужой» или протухший дружеский
          }
        }
        // для любых других ошибок по группам (например, group_not_found, cannot_join) — тоже молчим
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
          </MainLayout>
        </BrowserRouter>
      </div>
    </div>
  )
}

export default App
