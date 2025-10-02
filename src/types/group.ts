// src/types/group.ts
// Типы групп: опциональные поля для превью, используем last_activity_at

import type { GroupMember } from "./group_member"

export type GroupStatus = "active" | "archived"
export type SettleAlgorithm = "greedy" | "pairs"

export interface Group {
  id: number
  name: string
  description: string
  owner_id: number

  status: GroupStatus
  archived_at?: string | null
  deleted_at?: string | null
  end_date?: string | null
  auto_archive: boolean
  default_currency_code: string

  /** Выбранный алгоритм взаимозачёта на уровне группы */
  settle_algorithm: SettleAlgorithm

  /** URL аватара группы (если установлен) */
  avatar_url?: string | null

  members_count?: number
  members?: GroupMember[]

  last_activity_at?: string | null
  is_telegram_linked?: boolean
  is_hidden?: boolean
}

export interface GroupPreview {
  id: number
  name: string
  description: string
  owner_id: number
  members_count: number
  preview_members: GroupMember[]

  /** URL аватара группы в списках (если установлен) */
  avatar_url?: string | null

  /** Алгоритм (для бейджа/иконки на карточке, опционально) */
  settle_algorithm?: SettleAlgorithm

  status?: GroupStatus
  archived_at?: string | null
  deleted_at?: string | null
  default_currency_code?: string
  last_activity_at?: string | null
  is_telegram_linked?: boolean
  is_hidden?: boolean
}
