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

export interface ListResponse<T> {
  items: T[]
  total: number
}
