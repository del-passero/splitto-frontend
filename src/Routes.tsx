// src/Routes.tsx
import { Routes, Route, Navigate } from "react-router-dom"
import App from "./App"
import DashboardPage from "./pages/DashboardPage"
import ContactsPage from "./pages/ContactsPage"
import GroupsPage from "./pages/GroupsPage"
import ProfilePage from "./pages/ProfilePage"

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<App />}>
      <Route index element={<DashboardPage />} />
      <Route path="contacts" element={<ContactsPage />} />
      <Route path="groups" element={<GroupsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Route>
  </Routes>
)
export default AppRoutes
