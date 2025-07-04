import { useEffect, useState } from "react";
import { authTelegramUser, getAllUsers } from "../api/usersApi";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // initData из Telegram WebApp
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || "";
    console.log("[ProfilePage] Telegram initData:", initData);

    if (!initData) {
      setError("Нет initData от Telegram WebApp");
      return;
    }

    authTelegramUser(initData)
      .then((user) => {
        console.log("[ProfilePage] Current user:", user);
        setCurrentUser(user);
      })
      .catch((err) => {
        console.error("[ProfilePage] Ошибка авторизации:", err);
        setError(String(err));
      });

    getAllUsers(initData)
      .then((allUsers) => {
        console.log("[ProfilePage] All users:", allUsers);
        setUsers(allUsers);
      })
      .catch((err) => {
        console.error("[ProfilePage] Ошибка получения списка пользователей:", err);
        setError(String(err));
      });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Профиль</h2>
      {error && <div style={{ color: "red" }}>Ошибка: {error}</div>}

      <div style={{ marginBottom: 16 }}>
        <b>Текущий пользователь:</b>
        <pre>{currentUser ? JSON.stringify(currentUser, null, 2) : "Загрузка..."}</pre>
      </div>

      <div>
        <b>Все пользователи:</b>
        <pre>{users.length ? JSON.stringify(users, null, 2) : "Загрузка..."}</pre>
      </div>
    </div>
  );
}
