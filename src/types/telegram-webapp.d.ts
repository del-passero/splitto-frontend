// src/types/telegram-webapp.d.ts

interface TelegramWebAppThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  [key: string]: string | undefined;
}

interface TelegramWebApp {
  themeParams: TelegramWebAppThemeParams;
  // ... другие параметры WebApp при необходимости
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
