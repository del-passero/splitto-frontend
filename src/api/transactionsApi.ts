// src/api/transactionsApi.ts
// API транзакций: список/создание/удаление.
// Везде подставляем x-telegram-initdata. Формат ответа для списка: читаем массив и заголовок X-Total-Count.

import type {
  TransactionOut,
  TransactionCreateRequest,
  TxType,
} from "../types/transaction";

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  "https://splitto-backend-prod-ugraf.amvera.io/api";

// Нормализуем базовый URL:
// - всегда апгрейдим до HTTPS, кроме localhost/127.0.0.1
// - срезаем хвостовые слэши
const API_BASE = (() => {
  const raw = RAW_API_URL.replace(/\/+$/, "");
  try {
    const u = new URL(raw);
    const host = u.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (!isLocal && u.protocol === "http:") {
      u.protocol = "https:";
      return u.toString().replace(/\/+$/, "");
    }
    return raw;
  } catch {
    return raw;
  }
})();

// Склейка пути и query без двойных слэшей и без "/?"
function makeUrl(path: string, qs?: string) {
  const base = API_BASE.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${p}`;
  if (qs && qs.length) return `${url}?${qs}`;
  return url;
}

function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || "";
}

function buildQuery(params: Record<string, unknown>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)));
    else sp.append(k, String(v));
  });
  return sp.toString();
}

/** Получить транзакции с пагинацией и фильтрами. Возвращает { total, items } */
export async function getTransactions(params: {
  groupId?: number;
  userId?: number;
  type?: TxType;
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<{ total: number; items: TransactionOut[] }> {
  const qs = buildQuery({
    group_id: params.groupId,
    user_id: params.userId,
    type: params.type,
    offset: params.offset ?? 0,
    limit: params.limit ?? 20,
  });

  // ВАЖНО: список — со слэшем (роутер: @router.get("/"))
  const res = await fetch(makeUrl("/transactions/", qs), {
    method: "GET",
    credentials: "include",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
    },
    signal: params.signal,
  });

  if (!res.ok) throw new Error(await res.text());

  const total = Number(res.headers.get("X-Total-Count") || "0");
  const items = (await res.json()) as TransactionOut[];
  return { total, items };
}

/** Получить одну транзакцию */
export async function getTransaction(transactionId: number): Promise<TransactionOut> {
  // ВАЖНО: item — БЕЗ конечного слэша (роутер: @router.get("/{transaction_id}"))
  const res = await fetch(makeUrl(`/transactions/${transactionId}`), {
    method: "GET",
    credentials: "include",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as TransactionOut;
}

/** Создать транзакцию */
export async function createTransaction(payload: TransactionCreateRequest): Promise<TransactionOut> {
  // ВАЖНО: коллекция — со слэшем (роутер: @router.post("/"))
  const res = await fetch(makeUrl("/transactions/"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-telegram-initdata": getTelegramInitData(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as TransactionOut;
}

/** Обновить транзакцию */
export async function updateTransaction(transactionId: number, payload: any): Promise<TransactionOut> {
  // ВАЖНО: item — БЕЗ конечного слэша (роутер: @router.put("/{transaction_id}"))
  const res = await fetch(makeUrl(`/transactions/${transactionId}`), {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-telegram-initdata": getTelegramInitData(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as TransactionOut;
}

/** Удалить транзакцию (soft delete на бэке) */
export async function removeTransaction(transactionId: number): Promise<void> {
  // ВАЖНО: item — БЕЗ конечного слэша (роутер: @router.delete("/{transaction_id}"))
  const res = await fetch(makeUrl(`/transactions/${transactionId}`), {
    method: "DELETE",
    credentials: "include",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
    },
  });
  if (!res.ok) throw new Error(await res.text());
}

/* ===================== ЧЕКИ (upload/bind/delete) ===================== */

/** Загрузить файл чека (ТОЛЬКО image/*) и получить URL */
export async function uploadReceipt(file: File): Promise<{ url: string }> {
  // Больше не принимаем PDF — только изображения
  const isImage = (file.type || "").toLowerCase().startsWith("image/");
  const hasExt = /\.[a-z0-9]+$/i.test(file.name || "");

  if (!isImage && !hasExt) {
    // если meta пустые (иногда встречается), мягко нормализуем к jpeg
    file = new File([file], "receipt.jpg", { type: "image/jpeg" });
  }

  if (!(file.type || "").toLowerCase().startsWith("image/")) {
    throw new Error("Можно прикреплять только изображения (image/*).");
  }

  const fd = new FormData();
  fd.append("file", file, file.name || "receipt.jpg");

  const res = await fetch(makeUrl("/upload/receipt"), {
    method: "POST",
    credentials: "include",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
      // Content-Type не ставим — браузер сам добавит boundary
    },
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as { url: string };
}

/** Привязать чек к транзакции по URL (можно абсолютный или относительный "/media/receipts/...") */
export async function setTransactionReceiptUrl(
  transactionId: number,
  url: string
): Promise<TransactionOut> {
  const res = await fetch(makeUrl(`/transactions/${transactionId}/receipt/url`), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-telegram-initdata": getTelegramInitData(),
    },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as TransactionOut;
}

/** Удалить прикреплённый к транзакции чек */
export async function deleteTransactionReceipt(transactionId: number): Promise<void> {
  const res = await fetch(makeUrl(`/transactions/${transactionId}/receipt`), {
    method: "DELETE",
    credentials: "include",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
    },
  });
  if (!res.ok) throw new Error(await res.text());
}
