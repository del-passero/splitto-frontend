// src/types/telegram-webapp.d.ts

export interface TelegramWebAppThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  [key: string]: string | undefined;
}

export interface TelegramWebApp {
  themeParams: TelegramWebAppThemeParams;
  // ... другие свойства можешь добавить по документации
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
