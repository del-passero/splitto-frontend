// src/api/usersApi.ts

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api";

// Тип пользователя
export interface User {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string;
  username: string;
  photo_url: string;
  language_code: string;
  name: string;
}

// Авторизация через Telegram (POST /api/auth/telegram)
export async function authTelegramUser(initData: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Получить всех пользователей (GET /api/users/)
export async function getAllUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/users/`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
