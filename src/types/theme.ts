// src/types/theme.ts

export const SUPPORTED_LANGS = ["ru", "en", "es"] as const;
export type LangCode = typeof SUPPORTED_LANGS[number];
export type ThemeType = "auto" | "light" | "dark";
