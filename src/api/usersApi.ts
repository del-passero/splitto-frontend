// src/api/usersApi.ts
export type User = {
  telegram_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  language_code?: string;
};

const API_URL = "https://splitto-backend-prod-ugraf.amvera.io/api";

export async function authTelegramUser(initData: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getAllUsers(initData: string): Promise<User[]> {
  const res = await fetch(`${API_URL}/users/`, {
    headers: {
      "Content-Type": "application/json",
      "x-telegram-initdata": initData,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
