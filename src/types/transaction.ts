// src/types/transaction.ts

import type { Group } from "./group"
import type { GroupMember } from "./group_member"
import type { ExpenseCategory } from "./expense_category"

export type TransactionType = "expense" | "transfer"

export interface TransactionShare {
  id: number
  transaction_id: number
  user_id: number
  amount: number
  shares: number
}

export interface Transaction {
  id: number
  group_id: number
  amount: number
  type: TransactionType
  date: string
  description?: string
  deleted: boolean
  currency: string

  // optional fields
  group?: Group
  category?: ExpenseCategory
  shares?: TransactionShare[]

  // расход: кто оплатил
  paid_by?: number | null
  paid_by_member?: GroupMember | null

  // перевод: между какими счетами
  transfer_from?: number | null
  transfer_to?: number | null
}
