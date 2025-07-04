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
 * Отправляет initData как application/x-www-form-urlencoded.
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
      "Content-Type": "application/x-www-form-urlencoded", // ← важно!
    },
    body: formData.toString(), // ← строка вида "initData=..."
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ошибка авторизации: ${errorText}`);
  }

  return res.json(); // Возвращает UserOut из FastAPI
}