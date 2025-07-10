// src/App.tsx
import ProfilePage from "./pages/ProfilePage"

// Главный компонент приложения — просто показывает страницу профиля (или роутер если нужен)
const App = () => {
  return (
    <div className="min-h-screen w-full bg-[var(--tg-bg-color)]">
      <ProfilePage />
    </div>
  )
}

export default App
