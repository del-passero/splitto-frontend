// src/types/user.ts

/**
 * Тип пользователя для Splitto — полностью соответствует backend-модели (UserOut).
 */

export interface User {
  /** Внутренний id пользователя (Splitto) */
  id: number;
  /** Уникальный Telegram ID пользователя */
  telegram_id: number;
  /** Username пользователя (или null, если не задан) */
  username: string | null;
  /** Имя пользователя (или null) */
  first_name: string | null;
  /** Фамилия пользователя (или null) */
  last_name: string | null;
  /** Имя для отображения (или null, обычно first_name + last_name или username) */
  name: string | null;
  /** Ссылка на фото профиля (или null) */
  photo_url: string | null;
  /** Язык пользователя ('ru', 'en', 'es', ...), может быть null */
  language_code: string | null;
  /** Разрешает ли пользователь писать ему в ЛС через Telegram */
  allows_write_to_pm: boolean;
  /** Дата создания (ISO-строка) */
  created_at: string;
  /** Дата последнего изменения (ISO-строка) */
  updated_at: string;
  phone?: string; // <-- ДОБАВЬ ЭТУ СТРОКУ
  is_pro?: boolean // <-- ДОБАВЬ ЭТУ СТРОКУ
}
