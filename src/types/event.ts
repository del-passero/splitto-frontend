// src/types/event.ts
// Минимальные ссылки, чтобы не тащить все типы пользователей/групп
export interface ActorRef {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  name?: string
  photo_url?: string
}

export interface GroupRef {
  id: number
  name?: string
  avatar_url?: string
}

export type EventType =
  | "friend_added"
  | "friend_hidden"
  | "friend_unhidden"
  | "invite_registered"
  | "group_created"
  | "group_renamed"
  | "group_avatar_changed"
  | "group_archived"
  | "group_unarchived"
  | "group_deleted"
  | "member_added"
  | "member_removed"
  | "member_left"
  | "transaction_created"
  | "transaction_updated"
  | "transaction_receipt_added"
  | "transaction_receipt_replaced"
  | "transaction_receipt_removed"
  | "transaction_deleted"            // NEW
  // На будущее/совместимость:
  | "friendship_created"
  | "friendship_removed"
  | (string & {}) // чтобы не падать на незнакомых типах

export interface EventItem {
  id: number
  type: EventType | string
  created_at: string

  actor_id?: number
  target_user_id?: number
  group_id?: number
  transaction_id?: number

  // Бэкенд может присылать вложенные сущности — учитываем
  actor?: ActorRef
  target_user?: ActorRef
  group?: GroupRef

  data?: Record<string, any>

  // Опционально: идемпотентный ключ события (если бэк прислал)
  idempotency_key?: string | null
}

export interface EventsResponse {
  items: EventItem[]
  nextBefore?: string | null // курсор для следующей подгрузки (если сервер не прислал — берём из последнего created_at)
}
