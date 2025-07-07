// src/contexts/ThemeLangContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useTelegramThemeParams } from "../hooks/useTelegramTheme";
import { getTelegramUser } from "../hooks/useTelegramUser";

const SUPPORTED_LANGS = ["en", "ru", "es"] as const;
type LangCode = typeof SUPPORTED_LANGS[number] | "auto";
type ThemeType = "auto" | "light" | "dark";

interface ThemeLangContextValue {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  realTheme: ThemeType; // <-- исправил тут!
  themeParams: any;
  lang: LangCode;
  setLang: (l: LangCode) => void;
  realLang: LangCode;
}

const ThemeLangContext = createContext<ThemeLangContextValue | undefined>(undefined);

export function useThemeLang() {
  const ctx = useContext(ThemeLangContext);
  if (!ctx) throw new Error("useThemeLang must be used inside ThemeLangProvider");
  return ctx;
}

export function ThemeLangProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem("theme_type");
    return (saved as ThemeType) || "auto";
  });
  const [lang, setLang] = useState<LangCode>(() => {
    const saved = localStorage.getItem("lang_code");
    return (saved as LangCode) || "auto";
  });

  const themeParams = useTelegramThemeParams();
  const tgUser = getTelegramUser();

  useEffect(() => {
    localStorage.setItem("theme_type", theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("lang_code", lang);
  }, [lang]);

  // Язык Telegram
  const tgLang: LangCode =
    tgUser?.language_code && SUPPORTED_LANGS.includes(tgUser.language_code)
      ? (tgUser.language_code as LangCode)
      : "en";

  // Тема Telegram
  const realThemeTelegram: "light" | "dark" =
    themeParams?.bg_color && themeParams.bg_color.toLowerCase() === "#ffffff"
      ? "light"
      : "dark";

  const currentTheme: ThemeType = theme === "auto" ? "auto" : theme;
  const currentLang = lang === "auto" ? tgLang : lang;

  return (
    <ThemeLangContext.Provider
      value={{
        theme,
        setTheme,
        realTheme: currentTheme, // <-- исправлено!
        themeParams,
        lang,
        setLang,
        realLang: currentLang,
      }}
    >
      {children}
    </ThemeLangContext.Provider>
  );
}
