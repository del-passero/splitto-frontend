// src/types/group.ts

/**
 * Интерфейсы для работы с группами и участниками групп
 * Используется для типизации api, store и компонентов групп.
 * Все тексты только через i18n, светлая/тёмная тема поддерживается через твои переменные.
 */

import type { User } from "./user" // тип User уже есть у тебя (user.ts)

/**
 * Описание участника группы (GroupMember)
 * id — уникальный id участника в таблице group_members
 * group_id — id группы
 * user — объект User (содержит все данные пользователя: имя, username, аватар, и т.д.)
 */
export interface GroupMember {
  id: number
  group_id: number
  user: User
}

/**
 * Описание группы (Group)
 * id — уникальный идентификатор группы
 * name — название группы
 * description — описание (может быть пустым)
 * owner_id — id пользователя-владельца (важно для выделения владельца)
 * members_count — количество участников (опционально, используется при выводе списка групп)
 * members — массив участников (GroupMember) — может быть отсутствовать при списке групп, обязательно на странице группы
 */
export interface Group {
  id: number
  name: string
  description: string
  owner_id: number
  members_count?: number      // для списка групп
  members?: GroupMember[]     // для страницы группы
}
