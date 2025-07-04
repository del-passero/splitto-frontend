import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (tg) tg.ready();
    console.log("[App] Telegram WebApp =", tg);
  }, []);

  return (
    <Router>
      <nav style={{ padding: 12 }}>
        <Link to="/profile" style={{ marginRight: 16 }}>Профиль</Link>
      </nav>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}
