// src/hooks/useTelegramAuth.ts
import { useEffect } from "react"
import { useUserStore } from "../store/userStore"
import { authTelegramUser } from "../api/usersApi"
import { getTelegramInitData } from "./useTelegramUser"

// Хук для авторизации пользователя через backend
export function useTelegramAuth() {
  const setUser = useUserStore(s => s.setUser)
  useEffect(() => {
    const initData = getTelegramInitData()
    if (!initData) return
    authTelegramUser(initData)
      .then(user => setUser(user))
      .catch(() => setUser(null))
  }, [setUser])
}
