// src/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import { authTelegramUser, getAllUsers, type User } from "../api/usersApi";

export default function ProfilePage() {
  const [me, setMe] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Получаем initData из Telegram WebApp API
  const initData = window.Telegram?.WebApp?.initData || "";

  const handleAuth = async () => {
    setLoading(true);
    try {
      const user = await authTelegramUser(initData);
      setMe(user);
      const all = await getAllUsers(initData);
      setUsers(all);
    } catch (err) {
      alert("Ошибка авторизации: " + (err as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    // handleAuth(); // Если хочешь авто-логин по загрузке — раскомментируй
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Профиль</h1>
      <button onClick={handleAuth} disabled={loading}>
        {loading ? "Загрузка..." : "Войти через Telegram"}
      </button>
      {me && (
        <div>
          <h2>Вы:</h2>
          <div>
            <b>ID:</b> {me.telegram_id}<br />
            <b>Username:</b> {me.username || "—"}<br />
            <b>Имя:</b> {me.first_name} {me.last_name}
          </div>
        </div>
      )}
      <h2>Все пользователи:</h2>
      <ul>
        {users.map((u) => (
          <li key={u.telegram_id}>
            {u.telegram_id} – @{u.username || "—"}
          </li>
        ))}
      </ul>
    </div>
  );
}
