// src/pages/ProfilePage.tsx

import { authTelegramUser } from "../api/usersApi";

export default function ProfilePage() {
  const handleAuth = async () => {
    if (window.Telegram?.WebApp?.initData) {
      const initData = window.Telegram.WebApp.initData;

      try {
        const user = await authTelegramUser(initData);
        console.log("✅ Авторизован:", user);
      } catch (err) {
        console.error("❌ Ошибка авторизации:", err);
      }
    } else {
      console.warn("⚠️ Telegram WebApp недоступен");
    }
  };

  return (
    <div>
      <h1>Профиль</h1>
      <button onClick={handleAuth}>Войти через Telegram</button>
    </div>
  );
}