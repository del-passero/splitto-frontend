// src/api/transactionsApi.ts
// API транзакций: список/создание/удаление.
// Везде подставляем x-telegram-initdata. Формат ответа для списка: читаем массив и заголовок X-Total-Count.

import type {
  TransactionOut,
  TransactionCreateRequest,
  TxType,
} from "../types/transaction"

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  "https://splitto-backend-prod-ugraf.amvera.io/api"

// Нормализуем базовый URL:
// - всегда апгрейдим до HTTPS, кроме localhost/127.0.0.1
// - срезаем хвостовые слэши
const API_BASE = (() => {
  const raw = RAW_API_URL.replace(/\/+$/, "")
  try {
    const u = new URL(raw)
    const host = u.hostname
    const isLocal = host === "localhost" || host === "127.0.0.1"
    if (!isLocal && u.protocol === "http:") {
      u.protocol = "https:"
      return u.toString().replace(/\/+$/, "")
    }
    return raw
  } catch {
    return raw
  }
})()

// Склейка пути и query без двойных слэшей и без "/?"
function makeUrl(path: string, qs?: string) {
  // убираем двойные слэши на стыке
  const base = API_BASE.replace(/\/+$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  const url = `${base}${p}`
  if (qs && qs.length) return `${url}?${qs}`
  return url
}

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

  // ВАЖНО: используем /transactions/ (со слэшем), чтобы не ловить 307
  const res = await fetch(makeUrl("/transactions/", qs), {
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

/** Получить одну транзакцию */
export async function getTransaction(transactionId: number): Promise<TransactionOut> {
  const res = await fetch(makeUrl(`/transactions/${transactionId}/`), {
    method: "GET",
    credentials: "include",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

/** Создать транзакцию */
export async function createTransaction(payload: TransactionCreateRequest): Promise<TransactionOut> {
  // ВАЖНО: /transactions/ со слэшем — иначе FastAPI отдаёт 307
  const res = await fetch(makeUrl("/transactions/"), {
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

/** Обновить транзакцию */
export async function updateTransaction(transactionId: number, payload: any): Promise<TransactionOut> {
  // ВАЖНО: trailing slash, чтобы не ловить 307 и 405
  const res = await fetch(makeUrl(`/transactions/${transactionId}/`), {
    method: "PUT",
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
  // Тоже со слэшем, чтобы не ловить редирект
  const res = await fetch(makeUrl(`/transactions/${transactionId}/`), {
    method: "DELETE",
    credentials: "include",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
    },
  })
  if (!res.ok) throw new Error(await res.text())
}
