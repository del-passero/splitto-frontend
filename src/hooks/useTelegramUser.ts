// src/hooks/useTelegramUser.ts
import { useEffect } from "react"
import { useUserStore } from "../store/userStore"
import type { User } from "../types/user"

// Получить TelegramUser из Telegram WebApp
export function getTelegramUser() {
  //@ts-ignore
  return window?.Telegram?.WebApp?.initDataUnsafe?.user || null
}

// Получить строку initData для авторизации через backend
export function getTelegramInitData() {
  //@ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

// Хук для загрузки и сохранения TelegramUser (минимальный формат)
export function useTelegramUser() {
  const { user, setUser } = useUserStore()
  useEffect(() => {
    const tgUser = getTelegramUser()
    if (tgUser) {
      setUser({
        id: 0,
        telegram_id: tgUser.id,
        username: tgUser.username ?? undefined,
        first_name: tgUser.first_name ?? undefined,
        last_name: tgUser.last_name ?? undefined,
        name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
        photo_url: tgUser.photo_url ?? undefined,
        language_code: tgUser.language_code ?? undefined,
        allows_write_to_pm: undefined,
        created_at: undefined,
        updated_at: undefined,
      })
    }
  }, [setUser])
  return user
}
