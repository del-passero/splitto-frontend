// src/types/transaction.ts
import type { ExpenseCategoryOut } from "./expense_category"

export type TxType = "expense" | "transfer"
export type SplitType = "equal" | "shares" | "custom"

export interface TransactionShareOut {
  id: number
  user_id: number
  amount: string // Decimal как строка
  shares?: number | null
}

/** Упрощённый User для подмешивания в транзакцию (включает вышедших из группы) */
export interface RelatedUser {
  id: number
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  photo_url?: string | null
  name?: string | null
  avatar_url?: string | null
}

export interface TransactionOut {
  id: number
  group_id: number
  type: TxType
  amount: string // Decimal как строка
  date: string // ISO
  comment?: string | null
  category_id?: number | null
  paid_by?: number | null
  split_type?: SplitType | null
  transfer_from?: number | null
  transfer_to?: number[] | null

  created_by: number
  created_at: string // ISO
  updated_at: string // ISO
  currency_code?: string | null
  is_deleted?: boolean
  receipt_url?: string | null
  receipt_data?: Record<string, unknown> | null

  category?: ExpenseCategoryOut | null
  shares: TransactionShareOut[]

  /** ДОБАВЛЕНО: все участники транзакции, в т.ч. вышедшие из группы */
  related_users?: RelatedUser[]
}

export interface TransactionCreateRequest {
  group_id: number
  type: TxType
  amount: string // Decimal строкой
  date: string // ISO
  comment?: string
  category_id?: number | null
  paid_by?: number | null
  split_type?: SplitType | null
  transfer_from?: number | null
  transfer_to?: number[] | null
  currency_code?: string | null
  shares?: Array<{
    user_id: number
    amount: string
    shares?: number | null
  }>
}

/** (Опционально) Пэйлоад для PUT /transactions/{id} — если захочешь строгую типизацию */
export interface TransactionUpdateRequest {
  amount: string
  date: string
  comment?: string | null
  currency_code: string
  // expense-only:
  category_id?: number | null
  paid_by?: number | null
  split_type?: SplitType | null
  shares?: Array<{ user_id: number; amount: string; shares?: number | null }>
  // transfer-only:
  transfer_from?: number | null
  transfer_to?: number[] | null
  // чек (опционально, если когда-то решишь апдейтить через PUT):
  receipt_url?: string | null
  receipt_data?: Record<string, unknown> | null
}

export interface ListResponse<T> {
  items: T[]
  total: number
}
