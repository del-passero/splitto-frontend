// src/api/usersApi.ts

/**
 * Работа с API пользователей и авторизацией через Telegram WebApp.
 * Не забудь указать VITE_API_URL в .env для правильной работы в production/dev!
 */

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api";

// Тип пользователя — соответствует backend-модели UserOut
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

/**
 * Авторизация пользователя через Telegram WebApp.
 * Отправляет initData на backend, возвращает объект пользователя при успехе.
 * 
 * @param initData строка из Telegram.WebApp.initData
 * @returns Promise<User>
 */
export async function authTelegramUser(initData: string): Promise<User> {
  // ВАЖНО: используем полный адрес, чтобы работало в production и dev
  const response = await fetch(`${API_URL}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return await response.json();
}

/**
 * Получить всех пользователей (для примера/отладки)
 */
export async function getAllUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/users/`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
