// src/store/themeStore.ts

/**
 * Zustand-store для хранения текущей темы и языка приложения.
 * Это альтернатива Context для использования вне React-дерева (например, в сервисах или хуках).
 */

import { create } from "zustand";

type ThemeType = "auto" | "light" | "dark";
type LangCode = "ru" | "en" | "es" | "auto";

interface ThemeStore {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  lang: LangCode;
  setLang: (l: LangCode) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: "auto",
  setTheme: (theme) => set({ theme }),
  lang: "auto",
  setLang: (lang) => set({ lang }),
}));
