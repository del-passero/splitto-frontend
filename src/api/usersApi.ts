export interface User {
  id: number;
  telegram_id: number;
  name: string;
  username: string | null;
  photo_url: string | null;
}

const API_URL = "https://splitto-backend-prod-ugraf.amvera.io/api ";

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