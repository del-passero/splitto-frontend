// src/contexts/UserContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "../types/user";
import { getTelegramInitData } from "../hooks/useTelegramUser";
import { authTelegramUser } from "../api/usersApi";

interface UserContextValue {
  user: User | null;
  setUser: (u: User | null) => void;
  loading: boolean;
  error: string | null;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError(null);

      const cached = localStorage.getItem("user");
      if (cached) {
        setUser(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        const data = await authTelegramUser(getTelegramInitData());
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } catch (e: any) {
        setError(e.message || "Auth error");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, error, logout }}>
      {children}
    </UserContext.Provider>
  );
}
