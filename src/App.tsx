import { useApplyTheme } from "./hooks/useApplyTheme"
import { useTelegramAuth } from "./hooks/useTelegramAuth"
import ProfilePage from "./pages/ProfilePage"

const App = () => {
  useApplyTheme()
  useTelegramAuth()
  return <ProfilePage />
}

export default App
