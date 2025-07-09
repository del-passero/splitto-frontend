// src/api/usersApi.ts
import type { User } from "../types/user"

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

// Авторизация пользователя через Telegram WebApp backend
export async function authTelegramUser(initData: string): Promise<User> {
  const response = await fetch(`${API_URL}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  })
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}
