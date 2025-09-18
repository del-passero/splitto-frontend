// src/types/group.ts
// Типы групп: дополнили полями статуса/архива/удаления/валюты.
// Формат превью-группы — дополнен ТОЛЬКО опциональными полями (чтобы не ломать существующий код).

import type { GroupMember } from "./group_member"

/** Статус группы */
export type GroupStatus = "active" | "archived"

/**
 * Описание полной группы (страница группы, детали).
 * Добавлены новые поля backend: status/archived_at/deleted_at/end_date/auto_archive/default_currency_code.
 */
export interface Group {
  id: number
  name: string
  description: string
  owner_id: number

  // Новые поля:
  status: GroupStatus
  archived_at?: string | null
  deleted_at?: string | null
  end_date?: string | null
  auto_archive: boolean
  default_currency_code: string

  // В деталях можем получить состав/счётчик
  members_count?: number
  members?: GroupMember[]

  // (опционально) последняя активность
  last_activity_at?: string | null

  // (опционально) признак телеграм-связи — на будущее
  is_telegram_linked?: boolean
}

/**
 * Описание группы для превью/списка (не полные данные).
 * Добавли опциональные поля статуса/активности — чтобы карточка могла показать бейджи/активность.
 */
export interface GroupPreview {
  id: number
  name: string
  description: string
  owner_id: number
  members_count: number
  preview_members: GroupMember[]

  // опциональные новые поля (бэк может их прислать)
  status?: GroupStatus
  archived_at?: string | null
  deleted_at?: string | null
  default_currency_code?: string
  last_activity_at?: string | null
  is_telegram_linked?: boolean
}
