// src/App.tsx

/**
 * Главный компонент приложения.
 * Показывает страницу профиля (или можно добавить роутинг для других страниц).
 */
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <div>
      <ProfilePage />
    </div>
  );
}
