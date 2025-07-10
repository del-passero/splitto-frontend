// src/App.tsx
import ProfilePage from "./pages/ProfilePage"
import { useApplyTheme } from "./hooks/useApplyTheme"
import { useTelegramAuth } from "./hooks/useTelegramAuth"
import DebugTelegramInfo from "./components/DebugTelegramInfo" // <-- Импортируй!

const App = () => {
  useApplyTheme()
  useTelegramAuth()
  return (
    <>
      <DebugTelegramInfo /> {/* Вставь временно сюда! */}
      <ProfilePage />
    </>
  )
}

export default App
