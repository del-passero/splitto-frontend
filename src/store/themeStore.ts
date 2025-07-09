import { create } from "zustand";

interface UserSettingsState {
  theme: "auto" | "light" | "dark";
  language: "auto" | "ru" | "en" | "es";
  appVersion: string;
  setTheme: (theme: UserSettingsState["theme"]) => void;
  setLanguage: (lang: UserSettingsState["language"]) => void;
}

export const useUserSettings = create<UserSettingsState>((set) => ({
  theme: "auto",
  language: "auto",
  appVersion: "1.0.0",
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
}));
