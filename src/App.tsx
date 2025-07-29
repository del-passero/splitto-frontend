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
        //@ts-ignore
        console.log("initDataUnsafe:", tg?.initDataUnsafe)
        //@ts-ignore
        const token = tg?.initDataUnsafe?.start_param
        console.log("TOKEN из initDataUnsafe:", token)
        if (token) {
            acceptInvite(token)
                .then(() => {
                    // Можно показать уведомление, что вы добавлены в друзья!
                    console.log("acceptInvite вызван успешно")
                })
                .catch((err) => {
                    // Можно обработать ошибку (например, если уже в друзьях)
                    console.error("Ошибка при вызове acceptInvite:", err)
                })
        } else {
            console.log("Токен не найден — acceptInvite НЕ вызван")
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
