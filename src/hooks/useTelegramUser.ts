// src/hooks/useTelegramUser.ts

import { useEffect, useState } from "react";

export function useTelegramUser() {
  const [tgUser, setTgUser] = useState<any>(null);

  useEffect(() => {
    if (
      window.Telegram &&
      window.Telegram.WebApp &&
      window.Telegram.WebApp.initDataUnsafe
    ) {
      setTgUser(window.Telegram.WebApp.initDataUnsafe.user || null);
    }
  }, []);

  return tgUser;
}

export function getTelegramUser() {
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}
export function getTelegramInitData(): string {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
    return window.Telegram.WebApp.initData
  }
  return ""
}