// frontend/src/ProfilePage.tsx

import { useEffect, useState } from "react";
import { authTelegramUser, getAllUsers } from "../api/usersApi";
import type { User } from "../api/usersApi";



const tg = window.Telegram?.WebApp;

export default function ProfilePage() {
  const [me, setMe] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Берём initData из Telegram WebApp API
  const initData = tg?.initData || "";

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await authTelegramUser(initData);
      setMe(user);
      await loadUsers();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const users = await getAllUsers(initData);
      setUsers(users);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    // Можно сразу загрузить список пользователей
    if (initData) loadUsers();
  }, [initData]);

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 20 }}>
      <h2>Профиль</h2>
      <button onClick={handleAuth} disabled={loading || !initData}>
        {loading ? "Сохраняем..." : "Сохранить меня в базу"}
      </button>
      {error && <div style={{ color: "red", margin: "8px 0" }}>{error}</div>}
      {me && (
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12, margin: "16px 0" }}>
          <div><b>Вы:</b></div>
          <div>Имя: {me.first_name} {me.last_name}</div>
          <div>Username: {me.username}</div>
          <div>telegram_id: {me.telegram_id}</div>
          {me.photo_url && (
            <img src={me.photo_url} alt="avatar" width={64} style={{ borderRadius: 32 }} />
          )}
        </div>
      )}
      <h3>Пользователи</h3>
      <ul>
        {users.map(u => (
          <li key={u.telegram_id}>
            {u.telegram_id} — @{u.username || <i>без username</i>}
          </li>
        ))}
      </ul>
    </div>
  );
}
