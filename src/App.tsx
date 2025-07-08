// src/App.tsx
import { ThemeLangProvider } from "./contexts/ThemeLangContext"
import { UserProvider } from "./contexts/UserContext"
import ProfilePage from "./pages/ProfilePage"

export default function App() {
  return (
    <ThemeLangProvider>
      <UserProvider>
        <ProfilePage />
      </UserProvider>
    </ThemeLangProvider>
  )
}
