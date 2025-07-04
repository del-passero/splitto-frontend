import React, { useEffect, useState } from "react";
import { authTelegramUser } from "../api/usersApi";

interface User {
  id: number;
  telegram_id: number;
  name: string;
  username: string | null;
  photo_url: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      if (window.Telegram?.WebApp?.initData) {
        const initData = window.Telegram.WebApp.initData;

        try {
          const userData = await authTelegramUser(initData);
          setUser(userData);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Неизвестная ошибка");
        }
      } else {
        setError("Telegram WebApp недоступен");
      }
    };

    handleAuth();
  }, []);

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Профиль</h1>
      <p>ID: {user.telegram_id}</p>
      <p>Имя: {user.name}</p>
      {user.username && <p>Username: @{user.username}</p>}
      {user.photo_url && (
        <img src={user.photo_url} alt="Аватар" style={{ width: "100px", height: "100px", borderRadius: "50%" }} />
      )}
    </div>
  );
}