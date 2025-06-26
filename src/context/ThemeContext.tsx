import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ThemeParams = {
  [key: string]: string | undefined;
};

interface ThemeContextProps {
  themeParams: ThemeParams;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextProps>({
  themeParams: {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeParams, setThemeParams] = useState<ThemeParams>({});
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 1. Пробуем получить themeParams из Telegram WebApp API
    const tg = (window as any).Telegram?.WebApp;
    let params: ThemeParams = {};
    let dark = false;

    if (tg && tg.themeParams) {
      params = tg.themeParams;
      dark = tg.colorScheme === "dark";
    } else {
      // Fallback для локального теста
      params = {};
      dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    }

    setThemeParams(params);
    setIsDark(dark);

    // 2. Применяем все параметры как CSS custom properties
    const root = document.documentElement;
    Object.entries(params).forEach(([k, v]) => {
      if (v)
        root.style.setProperty(`--tg-theme-${k.replace(/_/g, "-")}`, v);
    });
    root.classList.toggle("dark", dark);

    // 3. Подписываемся на смену темы из Telegram (если поддерживается)
    if (tg && tg.onEvent) {
      const handler = () => {
        const updParams = tg.themeParams || {};
        setThemeParams(updParams);
        setIsDark(tg.colorScheme === "dark");
        Object.entries(updParams).forEach(([k, v]) => {
          if (v)
            root.style.setProperty(`--tg-theme-${k.replace(/_/g, "-")}`, v);
        });
        root.classList.toggle("dark", tg.colorScheme === "dark");
      };
      tg.onEvent("themeChanged", handler);
      return () => {
        tg.offEvent("themeChanged", handler);
      };
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ themeParams, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
