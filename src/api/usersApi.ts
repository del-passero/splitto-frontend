import type { User } from "../types/user";

// ЯВНЫЙ путь к API — вставь свой!
const API_URL = "https://splitto-backend-prod-ugraf.amvera.io/api";
console.log("API_URL =", API_URL);

// Получить текущего пользователя через Telegram WebApp API
export async function authTelegramUser(initData: string): Promise<User> {
  console.log("[authTelegramUser] initData =", initData);
  const res = await fetch(`${API_URL}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  console.log("[authTelegramUser] response status:", res.status);
  if (!res.ok) throw new Error("Ошибка авторизации: " + (await res.text()));
  return res.json();
}

// Получить всех пользователей (передаём initData в заголовке)
export async function getAllUsers(initData: string): Promise<User[]> {
  console.log("[getAllUsers] initData =", initData);
  const res = await fetch(`${API_URL}/users/`, {
    headers: {
      "Content-Type": "application/json",
      "x-telegram-initdata": initData,
    },
  });
  console.log("[getAllUsers] response status:", res.status);
  if (!res.ok) throw new Error("Ошибка получения пользователей: " + (await res.text()));
  return res.json();
}
