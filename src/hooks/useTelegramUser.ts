// src/hooks/useTelegramUser.ts
import { useEffect } from "react"
import { useUserStore } from "../store/userStore"
import type { User } from "../types/user"

// Получить TelegramUser как есть (до авторизации в backend)
export function getTelegramUser() {
  //@ts-ignore
  return window?.Telegram?.WebApp?.initDataUnsafe?.user || null
}

// Получить строку initData для передачи в backend
export function getTelegramInitData() {
  //@ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

// Хук для использования Telegram User в frontend (до авторизации в backend)
export function useTelegramUser() {
  const setUser = useUserStore(s => s.setUser)
  useEffect(() => {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
    if (tgUser) {
      setUser({
        id: 0,
        telegram_id: tgUser.id,
        username: tgUser.username ?? "",
        first_name: tgUser.first_name ?? "",
        last_name: tgUser.last_name ?? "",
        name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
        photo_url: tgUser.photo_url ?? "",
        language_code: tgUser.language_code ?? "",
        allows_write_to_pm: true,
        created_at: "",
        updated_at: "",
        is_pro: false,
        invited_friends_count: 0,
      })
    }
  }, [setUser])
}
