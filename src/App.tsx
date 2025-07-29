// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom"
import DashboardPage from "./pages/DashboardPage"
import GroupsPage from "./pages/GroupsPage"
import ContactsPage from "./pages/ContactsPage"
import ProfilePage from "./pages/ProfilePage"
import MainLayout from "./layouts/MainLayout"
import { useApplyTheme } from "./hooks/useApplyTheme"
import { useTelegramAuth } from "./hooks/useTelegramAuth"
import { useEffect } from "react"
import { acceptInvite } from "./api/friendsApi"

const App = () => {
    useApplyTheme()
    useTelegramAuth()

    useEffect(() => {
        //@ts-ignore
        const tg = window?.Telegram?.WebApp
        const initDataUnsafe = tg?.initDataUnsafe
        const token = initDataUnsafe?.start_param
        if (token) {
            acceptInvite(token)
                .then(() => {
                    // ����� �������� �����������, ��� �� ��������� � ������!
                })
                .catch((err) => {
                    // ����� ���������� ������ (��������, ���� ��� � �������)
                })
        }
    }, [])

    return (
        <BrowserRouter>
            <MainLayout>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/groups" element={<GroupsPage />} />
                    <Route path="/contacts" element={<ContactsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    )
}

export default App
