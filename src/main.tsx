// src/main.tsx
import "./styles/index.css"
import ReactDOM from "react-dom/client"
import ProfilePage from "./pages/ProfilePage"

// Стартуем сразу страницу профиля
ReactDOM.createRoot(document.getElementById("root")!).render(
  <ProfilePage />
)
