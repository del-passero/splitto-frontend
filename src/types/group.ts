// src/types/group.ts

import type { GroupMember } from "./group_member"

/**
 * Описание полной группы (страница группы, детали).
 */
export interface Group {
  id: number
  name: string
  description: string
  owner_id: number
  members_count?: number               // сколько всего участников (опционально, для UI)
  members?: GroupMember[]              // полный массив участников (только на детальной странице)
}

/**
 * Описание группы для превью/списка (не полные данные)
 */
export interface GroupPreview {
  id: number
  name: string
  description: string
  owner_id: number
  members_count: number
  preview_members: GroupMember[]       // только часть участников (например, 4 первых)
}
