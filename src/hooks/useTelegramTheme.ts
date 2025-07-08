// src/hooks/useTelegramTheme.ts

/**
 * Хук для подписки на текущие themeParams Telegram и обновления их при смене темы в Telegram.
 * Позволяет UI динамически реагировать на изменения темы/цвета без reload.
 */

import { useEffect, useState } from "react";

export function useTelegramThemeParams() {
  const [themeParams, setThemeParams] = useState<any>(() => {
    // Берём из SDK если доступно, иначе пустой объект
    return window.Telegram?.WebApp?.themeParams || {};
  });

  useEffect(() => {
    // Функция обновления themeParams по событию из Telegram SDK
    const updateTheme = () => {
      setThemeParams(window.Telegram?.WebApp?.themeParams || {});
    };

    // Подписываемся на событие смены темы (theme_changed)
    window.Telegram?.WebApp?.onEvent?.("themeChanged", updateTheme);

    // Отписка при размонтировании
    return () => {
      window.Telegram?.WebApp?.offEvent?.("themeChanged", updateTheme);
    };
  }, []);

  return themeParams;
}
