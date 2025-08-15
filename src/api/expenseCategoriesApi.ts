// src/api/expenseCategoriesApi.ts
// API категорий расходов: список верхнего уровня и подкатегорий через parent_id.
// Формат ответа: массив + заголовок X-Total-Count → возвращаем { total, items }.

import type { ExpenseCategoryOut } from "../types/expense_category"

const API_URL =
  (import.meta.env as any).VITE_API_URL ||
  "https://splitto-backend-prod-ugraf.amvera.io/api"

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

/**
 * Получить категории.
 * Если parentId не передан или равен null — вернёт топ-уровень (parent_id IS NULL).
 * Если parentId — число, вернёт подкатегории.
 */
export async function getExpenseCategories(params: {
  parentId?: number | null
  offset?: number
  limit?: number
  signal?: AbortSignal
}): Promise<{ total: number; items: ExpenseCategoryOut[] }> {
  const { parentId, offset = 0, limit = 20, signal } = params || {}

  // parent_id добавляем в запрос только если он задан как число
  const qs = buildQuery({
    ...(typeof parentId === "number" ? { parent_id: parentId } : {}),
    offset,
    limit,
  })

  const res = await fetch(`${API_URL}/expense-categories?${qs}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
    },
    signal,
  })

  if (!res.ok) throw new Error(await res.text())

  const total = Number(res.headers.get("X-Total-Count") || "0")
  const items = (await res.json()) as ExpenseCategoryOut[]
  return { total, items }
}
