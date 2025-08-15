// src/api/transactionsApi.ts
// API транзакций: список/создание/удаление.
// Везде подставляем x-telegram-initdata. Формат ответа для списка: читаем массив и заголовок X-Total-Count.

import type {
  TransactionOut,
  TransactionCreateRequest,
  TxType,
} from "../types/transaction"

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

function buildQuery(params: Record<string, unknown>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)))
    else sp.append(k, String(v))
  })
  return sp.toString()
}

/** Получить транзакции с пагинацией и фильтрами. Возвращает { total, items } */
export async function getTransactions(params: {
  groupId?: number
  userId?: number
  type?: TxType
  offset?: number
  limit?: number
  signal?: AbortSignal
}): Promise<{ total: number; items: TransactionOut[] }> {
  const qs = buildQuery({
    group_id: params.groupId,
    user_id: params.userId,
    type: params.type,
    offset: params.offset ?? 0,
    limit: params.limit ?? 20,
  })

  const res = await fetch(`${API_URL}/transactions?${qs}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
    },
    signal: params.signal,
  })

  if (!res.ok) throw new Error(await res.text())

  const total = Number(res.headers.get("X-Total-Count") || "0")
  const items = (await res.json()) as TransactionOut[]
  return { total, items }
}

/** Создать транзакцию */
export async function createTransaction(payload: TransactionCreateRequest): Promise<TransactionOut> {
  const res = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-telegram-initdata": getTelegramInitData(),
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

/** Удалить транзакцию (soft delete на бэке) */
export async function removeTransaction(transactionId: number): Promise<void> {
  const res = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
    },
  })
  if (!res.ok) throw new Error(await res.text())
}
