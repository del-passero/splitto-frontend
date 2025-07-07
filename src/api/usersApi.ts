// src/api/usersApi.ts

import type { User } from "../types/user";

/**
 * Работа с API пользователей и авторизацией через Telegram WebApp.
 * Не забудь указать VITE_API_URL в .env для правильной работы в production/dev!
 */

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api";

export async function authTelegramUser(initData: string): Promise<User> {
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

export async function getAllUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/users/`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
