// src/pages/ProfilePage.tsx

import { useEffect, useState } from "react";
import { authTelegramUser, getAllUsers, type User } from "../api/usersApi";

export default function ProfilePage() {
  const tg = (window as any).Telegram?.WebApp;
  const [initData] = useState(tg?.initData || "");
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Автоматически получить всех пользователей при загрузке
  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  // Авторизация по кнопке
  async function handleAuth() {
    setLoading(true);
    setAuthError(null);
    try {
      const user = await authTelegramUser(initData);
      setUser(user);
      // После успешной авторизации — обновим список всех пользователей
      getAllUsers().then(setUsers);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h1>Профиль</h1>
      <div>
        <b>initData:</b>
        <div style={{ fontSize: 10, wordBreak: "break-all" }}>{initData || "(нет)"}</div>
      </div>
      <button style={{ width: "100%", marginTop: 12 }} onClick={handleAuth} disabled={loading}>
        {loading ? "Загрузка..." : "Авторизоваться через Telegram (отправить initData)"}
      </button>
      {authError && <div style={{ color: "red", marginTop: 8 }}>Ошибка авторизации: {authError}</div>}
      <hr />
      <div>
        <b>Текущий пользователь:</b>
        <div>
          {user ? (
            <>
              <div>telegram_id: {user.telegram_id}</div>
              <div>username: {user.username}</div>
              <div>Имя: {user.name}</div>
            </>
          ) : (
            <div>Авторизуйтесь через Telegram</div>
          )}
        </div>
      </div>
      <hr />
      <div>
        <b>Все пользователи:</b>
        <ul>
          {users.map((u) => (
            <li key={u.id}>
              telegram_id: {u.telegram_id}, username: {u.username}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
