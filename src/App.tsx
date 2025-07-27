import { BrowserRouter, Routes, Route } from "react-router-dom"
import DashboardPage from "./pages/DashboardPage"
import GroupsPage from "./pages/GroupsPage"
import ContactsPage from "./pages/ContactsPage"
import ProfilePage from "./pages/ProfilePage"
import MainLayout from "./layouts/MainLayout"
import { useApplyTheme } from "./hooks/useApplyTheme"
import { useTelegramAuth } from "./hooks/useTelegramAuth" // <-- добавь импорт

const App = () => {
    useApplyTheme()
    useTelegramAuth() // <-- вызови хук здесь!
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
