import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";

function HomePage() {
  return (
    <div className="max-w-xl mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Splitto</h1>
      <p className="mb-6">Добро пожаловать! Выберите страницу.</p>
      <Link
        to="/profile"
        className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
      >
        Профиль
      </Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* Если не найдено — редирект на главную */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
