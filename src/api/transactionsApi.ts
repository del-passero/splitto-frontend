// src/api/transactionsApi.ts
// Транзакции: список/деталь/создание/удаление (soft-delete).
// Учитывает новые правила бэкенда: валюта транзакции = валюта группы (можно НЕ слать),
// удаление — мягкое, фильтры по группе требуют членство, по user_id — только текущего юзера.

import type { Transaction } from "../types/transaction"
import { API_URL, tgFetchJson } from "./http"

/** Параметры фильтра для списка транзакций */
export type ListTransactionsParams = {
  groupId?: number
  userId?: number
  type?: "expense" | "transfer"
}

/** Вход для одной доли при создании */
export interface TransactionShareInput {
  user_id: number
  amount: number
  shares?: number | null
}

/** Пэйлоад создания транзакции (совместим с бэком) */
export interface CreateTransactionPayload {
  group_id: number
  type: "expense" | "transfer"
  amount: number
  date?: string            // ISO-строка; если не указать — на бэке свои дефолты
  description?: string
  category_id?: number | null
  paid_by?: number | null         // для expense
  transfer_from?: number | null   // для transfer
  currency?: string | null        // МОЖНО НЕ СЛАТЬ: бэк подставит валюту группы
  shares?: TransactionShareInput[]
}

/** Список транзакций с фильтрами (soft-deleted не возвращаются) */
export async function listTransactions(params?: ListTransactionsParams): Promise<Transaction[]> {
  const q: string[] = []
  if (params?.groupId != null) q.push(`group_id=${params.groupId}`)
  if (params?.userId != null) q.push(`user_id=${params.userId}`)
  if (params?.type) q.push(`type=${encodeURIComponent(params.type)}`)
  const qs = q.length ? `?${q.join("&")}` : ""
  const url = `${API_URL}/transactions${qs}`
  return tgFetchJson<Transaction[]>(url)
}

/** Одна транзакция (вернёт 404 если удалена/не найдена) */
export async function getTransaction(id: number): Promise<Transaction> {
  const url = `${API_URL}/transactions/${id}`
  return tgFetchJson<Transaction>(url)
}

/**
 * Создать транзакцию.
 * Важно:
 *  • currency можно НЕ указывать — бэк подставит валюту группы,
 *  • 403/409 ловим как Error с текстом (например, "Category is not allowed", "Transaction currency must match group currency").
 */
export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  const url = `${API_URL}/transactions/`
  return tgFetchJson<Transaction>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

/** Удалить (soft-delete) транзакцию */
export async function deleteTransaction(id: number): Promise<void> {
  const url = `${API_URL}/transactions/${id}`
  await tgFetchJson<void>(url, { method: "DELETE" })
}
