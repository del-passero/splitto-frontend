// src/contexts/UserContext.tsx
import { createContext, useContext, useState, useEffect } from "react"
import { User } from "../types/user"
import { authTelegramUser } from "../api/usersApi"
import { getTelegramInitData } from "../hooks/useTelegramUser"

interface UserContextProps {
  user: User | null
  loading: boolean
  error: string | null
  logout: () => void
}

const UserContext = createContext<UserContextProps | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUser() {
      setLoading(true)
      setError(null)
      try {
        const initData = getTelegramInitData()
        const u = await authTelegramUser(initData)
        setUser(u)
      } catch (e: any) {
        setError("Auth error: " + (e.message || e))
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  function logout() {
    setUser(null)
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  return (
    <UserContext.Provider value={{ user, loading, error, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used inside UserProvider")
  return ctx
}
