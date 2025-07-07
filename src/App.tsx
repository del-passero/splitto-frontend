// src/App.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";
// TODO: сюда добавим остальные страницы (Home, Friends, Groups, Feed)

export default function App() {
  return (
    <Routes>
      <Route path="/profile" element={<ProfilePage />} />
      {/* TODO: Добавить остальные маршруты позже */}
      <Route path="*" element={<Navigate to="/profile" />} />
    </Routes>
  );
}
