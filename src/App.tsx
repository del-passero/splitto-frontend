// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useEffect } from "react"

import DashboardPage from "./pages/DashboardPage"
import GroupsPage from "./pages/GroupsPage"
import GroupDetailsPage from "./pages/GroupDetailsPage"
import GroupDetailsPageSettings from "./pages/GroupDetailsPageSettings"
import ContactsPage from "./pages/ContactsPage"
import ProfilePage from "./pages/ProfilePage"
import TransactionEditPage from "./pages/TransactionEditPage"

import MainLayout from "./layouts/MainLayout"
import { useApplyTheme } from "./hooks/useApplyTheme"
import { useTelegramAuth } from "./hooks/useTelegramAuth"

import { acceptInvite as acceptFriendInvite } from "./api/friendsApi"

/**
 * Главный компонент приложения:
 * - Навигация по всем страницам (группы, детали группы, контакты, профиль, редактирование транзакции)
 * - Тематизация и авторизация через Telegram
 * - Логика приёма инвайта по токену (друзья/группа)
 */
const App = () => {
  useApplyTheme()
  useTelegramAuth()

  useEffect(() => {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp
    // @ts-ignore
    const tokenFromInitData = tg?.initDataUnsafe?.start_param

    // Для браузера: ищем token в URL (?startapp=... или ?start=...)
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get("startapp") || params.get("start")
    const token = tokenFromInitData || tokenFromUrl

    if (token) {
      // Сначала пытаемся принять инвайт как "друга"
      acceptFriendInvite(token)
        .then(() => {
          // Можно показать уведомление "Добавлен в друзья"
        })
        .catch(() => {
          // Если это не инвайт для друзей — игнорируем
        })
    }
  }, [])

  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailsPage />} />
          <Route path="/groups/:groupId/settings" element={<GroupDetailsPageSettings />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Новая страница редактирования транзакции */}
          <Route path="/transactions/:txId" element={<TransactionEditPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}

export default App
