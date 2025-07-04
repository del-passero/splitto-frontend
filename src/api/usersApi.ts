// frontend/src/api/usersApi.ts

export interface User {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
}

const API_URL = "https://splitto-backend-prod-ugraf.amvera.io/api ";

/**
 * Авторизует пользователя через Telegram WebApp.
 * Отправляет initData как form-data (x-www-form-urlencoded).
 */
export async function authTelegramUser(initData: string): Promise<User> {
  console.log("[authTelegramUser] initData =", initData);

  if (!initData) {
    throw new Error("initData не может быть пустым");
  }

  const formData = new URLSearchParams();
  formData.append("initData", initData);

  const res = await fetch(`${API_URL}/auth/telegram`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ошибка авторизации: ${errorText}`);
  }

  return res.json();
}

/**
 * Получает список всех пользователей.
 * Требует передачи initData в заголовке.
 */
export async function getAllUsers(initData: string): Promise<User[]> {
  console.log("[getAllUsers] initData =", initData);

  const res = await fetch(`${API_URL}/users/`, {
    headers: {
      "Content-Type": "application/json",
      "x-telegram-initdata": initData,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ошибка получения списка пользователей: ${errorText}`);
  }

  return res.json();
}