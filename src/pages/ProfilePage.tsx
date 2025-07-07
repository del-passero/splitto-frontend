import { useEffect, useState } from "react";
import { authTelegramUser, getAllUsers, User } from "../api/usersApi";

/**
 * Страница профиля пользователя + список всех пользователей.
 */
export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Авторизация пользователя через Telegram WebApp
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const initData = tg?.initData;

    if (!initData) {
      setError("Telegram WebApp не найден или не передал initData! Запустите приложение из Telegram.");
      return;
    }

    authTelegramUser(initData)
      .then(setUser)
      .catch(e => setError(e.message));
  }, []);

  // Загрузка всех пользователей, после авторизации
  useEffect(() => {
    if (!user) return;
    setUsersLoading(true);
    getAllUsers()
      .then(setUsers)
      .catch(e => setError("Ошибка загрузки пользователей: " + e.message))
      .finally(() => setUsersLoading(false));
  }, [user]);

  if (error) return <div style={{ color: 'red' }}>Ошибка: {error}</div>;
  if (!user) return <div>Авторизация через Telegram...</div>;

  return (
    <div>
      <h3>Ваш профиль</h3>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <h4>Список всех пользователей в базе:</h4>
      {usersLoading ? (
        <div>Загрузка пользователей...</div>
      ) : (
        <ol>
          {users.map((u, idx) => (
            <li key={u.id}>
              {idx + 1}. {u.name}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
