// src/hooks/useTelegramUser.ts

export function getTelegramUser() {
  return (window as any).Telegram?.WebApp?.initDataUnsafe?.user || null;
}

export function getTelegramInitData(): string {
  return (window as any).Telegram?.WebApp?.initData || "";
}
