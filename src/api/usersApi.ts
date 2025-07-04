// !!! Используем жёстко прописанный путь !!!
const API_BASE = "https://splitto-backend-prod-ugraf.amvera.io/api";

export async function authTelegramUser(initData: string): Promise<User> {
  console.log('[authTelegramUser] initData =', initData);
  console.log('[authTelegramUser] URL = https://splitto-backend-prod-ugraf.amvera.io/api', `${API_BASE}/auth/telegram`);

  const res = await fetch(`${API_BASE}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  console.log('[authTelegramUser] Response status =', res.status);
  const text = await res.text();
  console.log('[authTelegramUser] Response text =', text);

  if (!res.ok) throw new Error("Ошибка авторизации: " + text);
  return JSON.parse(text);
}

export async function getAllUsers(initData: string): Promise<User[]> {
  console.log('[getAllUsers] initData =', initData);
  console.log('[getAllUsers] URL =', `${API_BASE}/users/`);

  const res = await fetch(`${API_BASE}/users/`, {
    headers: {
      "Content-Type": "application/json",
      "x-telegram-initdata": initData,
    },
  });
  console.log('[getAllUsers] Response status =', res.status);
  const text = await res.text();
  console.log('[getAllUsers] Response text =', text);

  if (!res.ok) throw new Error("Ошибка получения пользователей: " + text);
  return JSON.parse(text);
}
