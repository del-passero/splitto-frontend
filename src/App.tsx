// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom"
import DashboardPage from "./pages/DashboardPage"
import GroupsPage from "./pages/GroupsPage"
import GroupDetailsPage from "./pages/GroupDetailsPage"
import ContactsPage from "./pages/ContactsPage"
import ProfilePage from "./pages/ProfilePage"
import MainLayout from "./layouts/MainLayout"
import { useApplyTheme } from "./hooks/useApplyTheme"
import { useTelegramAuth } from "./hooks/useTelegramAuth"
import { useEffect } from "react"
import { acceptInvite as acceptFriendInvite } from "./api/friendsApi"
import { acceptGroupInvite } from "./api/groupsApi"

/**
 * ������� ��������� ����������:
 * - ��������� �� ���� ��������� (������, ������ ������, ��������, �������)
 * - ����������� � ����������� ����� Telegram
 * - ������ ����� ������� �� ������ (������/������)
 */
const App = () => {
    useApplyTheme()
    useTelegramAuth()

    useEffect(() => {
        //@ts-ignore
        const tg = window?.Telegram?.WebApp
        //@ts-ignore
        const tokenFromInitData = tg?.initDataUnsafe?.start_param

        // ��� ��������: ���� token � URL (?startapp=...)
        const params = new URLSearchParams(window.location.search)
        const tokenFromUrl = params.get("startapp") || params.get("start")
        const token = tokenFromInitData || tokenFromUrl

        if (token) {
            // ������� �������� ������� ������ ��� "�����"
            acceptFriendInvite(token)
                .then(() => {
                    // ����� ���������� ����������� "�������� � ������"
                })
                .catch(() => {
                    // ���� ��� �� ������ ��� ������, ������� ������� ��� ������
                    acceptGroupInvite(token)
                        .then(() => {
                            // ����� ���������� ����������� "�������� � ������"
                        })
                        .catch(() => {
                            // ���� ����� �� ������� � ������ ����������
                        })
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
                    <Route path="/contacts" element={<ContactsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    )
}

export default App
