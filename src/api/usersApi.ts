// src/api/usersApi.ts

/**
 * API-модуль для работы с пользователями Splitto и авторизацией через Telegram WebApp.
 * Используй только этот модуль для всех запросов к backend, связанных с user.
 */

import type { User } from "../types/user";

// Получаем базовый URL API из переменных окружения (настроено через .env и Vite)
const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api";

/**
 * Авторизация пользователя через Telegram WebApp.
 * Передаём initData (из Telegram SDK), получаем объект пользователя.
 *
 * @param initData строка initData из Telegram.WebApp.initData
 * @returns Promise<User>
 */
export async function authTelegramUser(initData: string): Promise<User> {
  const response = await fetch(`${API_URL}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    // Ошибка сервера (например, неверная подпись)
    throw new Error(await response.text());
  }

  return await response.json();
}

/**
 * Получить всех пользователей (админ-фича, демо, тестирование).
 * @returns Promise<User[]>
 */
export async function getAllUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/users/`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

/**
 * (Будущий метод) Обновить профиль пользователя (PUT /users/me/ или аналог)
 * Можно реализовать, когда появится backend-метод редактирования.
 */
// export async function updateUserProfile(profileData: Partial<User>): Promise<User> {
//   const res = await fetch(`${API_URL}/users/me/`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(profileData),
//   });
//   if (!res.ok) throw new Error(await res.text());
//   return await res.json();
// }

