// src/types/group_member.ts

import type { User } from "./user"

/**
 * Описание участника группы (GroupMember)
 * id — уникальный id участника в таблице group_members
 * group_id — id группы
 * user — объект User (все поля пользователя)
 */
export interface GroupMember {
  id: number
  group_id: number
  user: User
}
