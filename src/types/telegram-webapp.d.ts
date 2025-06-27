interface TelegramWebAppThemeParams {
  bg_color?: string;
  text_color?: string;
  button_color?: string;
  button_text_color?: string;
  hint_color?: string;
  // ... ещё что нужно
}

interface TelegramWebApp {
  themeParams?: TelegramWebAppThemeParams;
  // ... другие методы Telegram.WebApp
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
