// src/hooks/useTelegramTheme.ts

import { useEffect, useState } from "react";

// Хук для получения themeParams из Telegram WebApp
export function useTelegramThemeParams() {
  const [themeParams, setThemeParams] = useState<any>(() => {
    return (window as any).Telegram?.WebApp?.themeParams || null;
  });

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    function handleThemeChanged() {
      setThemeParams(tg?.themeParams || null);
    }
    if (tg && tg.onEvent) {
      tg.onEvent("themeChanged", handleThemeChanged);
      return () => tg.offEvent("themeChanged", handleThemeChanged);
    }
  }, []);

  return themeParams;
}
