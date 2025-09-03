// src/api/usersApi.ts
import type { User } from "../types/user"

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

// Достаём initData из Telegram WebApp (безопасно)
export function getTelegramInitData(): string {
  // @ts-ignore
  return (window?.Telegram?.WebApp?.initData as string) || ""
}

// Парсим tg_user.id из initData (нужен для per-user ключа стора)
export function extractTgUserId(initData: string): number | null {
  try {
    const params = new URLSearchParams(initData)
    const userJson = params.get("user")
    if (!userJson) return null
    const u = JSON.parse(userJson)
    const id = Number(u?.id)
    return Number.isFinite(id) ? id : null
  } catch {
    return null
  }
}

// Авторизация пользователя через Telegram WebApp backend (твой вариант — initData в body)
export async function authTelegramUser(initData: string): Promise<User> {
  const response = await fetch(`${API_URL}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  })
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}

// Удобняшка: авторизуемся, автоматически беря initData из TG WebApp
export async function authTelegramUserAuto(): Promise<User> {
  const initData = getTelegramInitData()
  return authTelegramUser(initData)
}
