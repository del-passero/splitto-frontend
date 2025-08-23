// src/api/transactionsApi.ts
import type {
  TransactionOut,
  TransactionCreateRequest,
  TxType,
} from "../types/transaction"

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  "https://splitto-backend-prod-ugraf.amvera.io/api"

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

function makeUrl(path: string, qs?: string) {
  const base = API_BASE.replace(/\/+$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  const url = `${base}${p}`
  if (qs && qs.length) return `${url}?${qs}`
  return url
}

// НАДЁЖНО достаём initData из WebApp/URL, чтобы пережить сбои WebSocket у Telegram Web.
function getTelegramInitData(): string {
  // прямой доступ
  // @ts-ignore
  const webApp = window?.Telegram?.WebApp
  const direct = webApp?.initData
  if (direct && typeof direct === "string" && direct.length > 0) return direct

  // иногда доступно в initDataUnsafe
  const unsafe = webApp?.initDataUnsafe as any
  if (unsafe && typeof unsafe === "object" && typeof unsafe.query_id === "string") {
    // initDataUnsafe не содержит полноценную строку initData — пропускаем
  }

  // из URL (hash/search) — web.telegram.org добавляет tgWebAppData
  const tryExtract = (src: string) => {
    const m1 = src.match(/(?:^|[?#&])tgWebAppData=([^&]+)/)
    if (m1) return decodeURIComponent(m1[1])
    const m2 = src.match(/(?:^|[?#&])tgWebAppDataUrlEncoded=([^&]+)/)
    if (m2) return decodeURIComponent(m2[1])
    return ""
  }
  const fromHash = tryExtract(location.hash)
  if (fromHash) return fromHash
  const fromSearch = tryExtract(location.search)
  if (fromSearch) return fromSearch

  try {
    const spHash = new URLSearchParams(location.hash.replace(/^#/, ""))
    const spSearch = new URLSearchParams(location.search)
    const d = spHash.get("tgWebAppData") || spSearch.get("tgWebAppData")
    if (d) return d
  } catch { /* ignore */ }

  return ""
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

export async function createTransaction(payload: TransactionCreateRequest): Promise<TransactionOut> {
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

export async function updateTransaction(transactionId: number, payload: any): Promise<TransactionOut> {
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

export async function removeTransaction(transactionId: number): Promise<void> {
  const res = await fetch(makeUrl(`/transactions/${transactionId}/`), {
    method: "DELETE",
    credentials: "include",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
    },
  })
  if (!res.ok) throw new Error(await res.text())
}
