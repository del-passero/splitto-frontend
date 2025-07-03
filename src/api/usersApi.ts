import type { User } from "../types/user";

// Получить текущего пользователя через Telegram WebApp API
export async function authTelegramUser(initData: string): Promise<User> {
  const res = await fetch("/api/auth/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  if (!res.ok) throw new Error("Ошибка авторизации: " + (await res.text()));
  return res.json();
}

// Получить всех пользователей (передаём initData в заголовке)
export async function getAllUsers(initData: string): Promise<User[]> {
  const res = await fetch("/api/users/", {
    headers: {
      "Content-Type": "application/json",
      "x-telegram-initdata": initData,
    },
  });
  if (!res.ok) throw new Error("Ошибка получения пользователей: " + (await res.text()));
  return res.json();
}
