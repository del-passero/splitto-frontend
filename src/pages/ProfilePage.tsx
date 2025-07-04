import { useEffect, useState } from "react";
import { authTelegramUser, getAllUsers } from "../api/usersApi";
import type { User } from "../types/user";


export default function ProfilePage() {
  const [me, setMe] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData;
    if (!initData) {
      setError("Нет initData из Telegram WebApp, вот так вот!!!!");
      setLoading(false);
      return;
    }

    // Авторизуем пользователя и получаем список всех пользователей
    authTelegramUser(initData)
      .then((user) => {
        setMe(user);
        return getAllUsers(initData);
      })
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-center">Загрузка...</div>;
  if (error) return <div className="p-4 text-red-600">Ошибка: {error}</div>;
  if (!me) return null;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Мой профиль</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center mb-8">
        {me.photo_url && (
          <img
            src={me.photo_url}
            alt="avatar"
            className="w-16 h-16 rounded-full object-cover mr-4 border"
          />
        )}
        <div>
          <div className="font-bold text-lg">{me.first_name} {me.last_name}</div>
          {me.username && <div className="text-gray-500">@{me.username}</div>}
          {me.language_code && <div className="text-xs text-gray-400">Язык: {me.language_code}</div>}
          <div className="text-xs text-gray-400">ID: {me.telegram_id}</div>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-2">Все пользователи Splitto</h3>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <ul>
          {users.map((u) => (
            <li key={u.id} className="flex items-center mb-3">
              {u.photo_url && (
                <img
                  src={u.photo_url}
                  alt="ava"
                  className="w-8 h-8 rounded-full object-cover mr-3"
                />
              )}
              <div>
                <span className="font-medium">{u.first_name} {u.last_name}</span>
                {u.username && <span className="text-gray-500 ml-2">@{u.username}</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
