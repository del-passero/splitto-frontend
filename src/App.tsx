// src/App.tsx
import ProfilePage from "./pages/ProfilePage"
import { useApplyTheme } from "./hooks/useApplyTheme"

const App = () => {
  useApplyTheme() // Следит за темой и всегда правильно меняет body
  return <ProfilePage />
}

export default App
