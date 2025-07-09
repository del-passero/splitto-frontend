// src/types/telegram-web-app.d.ts

interface TelegramWebAppUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebAppThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface TelegramWebAppInitDataUnsafe {
  query_id?: string;
  user?: TelegramWebAppUser;
  receiver?: TelegramWebAppUser;
  chat_type?: string;
  chat_instance?: string;
  auth_date?: number;
  hash?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppInitDataUnsafe;
  themeParams: TelegramWebAppThemeParams;
  close: () => void;
  onEvent?: (eventType: string, callback: (...args: any[]) => void) => void;
  offEvent?: (eventType: string, callback: (...args: any[]) => void) => void;
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
