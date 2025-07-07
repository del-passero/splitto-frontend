// src/pages/ProfilePage.tsx

import { useEffect, useState } from "react";
import { authTelegramUser } from "../api/usersApi";

/**
 * Страница профиля пользователя.
 * После монтирования пытается авторизовать пользователя через Telegram WebApp.
 * Если initData не найден — показывает ошибку (запускать только через Telegram!)
 */
export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Получаем initData из Telegram.WebApp
    const tg = (window as any).Telegram?.WebApp;
    const initData = tg?.initData;

    if (!initData) {
      setError("Telegram WebApp не найден или не передал initData! Запустите приложение из Telegram.");
      return;
    }

    // Авторизуем пользователя через backend
    authTelegramUser(initData)
      .then(setUser)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div style={{ color: 'red' }}>Ошибка: {error}</div>;
  if (!user) return <div>Авторизация через Telegram...</div>;

  return (
    <div>
      <h3>Ваш профиль</h3>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
