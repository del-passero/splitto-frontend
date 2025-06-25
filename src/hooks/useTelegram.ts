// src/hooks/useTelegram.ts
export const useTelegram = () => {
  const tg = (window as any).Telegram?.WebApp;

  return {
    WebApp: tg,
    user: tg?.initDataUnsafe?.user,
    initData: tg?.initData,
    initDataUnsafe: tg?.initDataUnsafe,
    theme: tg?.themeParams,
  };
};
