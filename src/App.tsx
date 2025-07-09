// src/App.tsx
import ProfilePage from "./pages/ProfilePage"
import { useInitThemeLang } from "./hooks/useInitThemeLang"
import { useTelegramAuth } from "./hooks/useTelegramAuth"

const App = () => {
  useInitThemeLang()
  useTelegramAuth()
  return <ProfilePage />
}
export default App
