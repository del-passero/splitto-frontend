// src/api/groupCategoriesApi.ts
// Категории для конкретной группы (белый список). Список/линк/анлинк/создание новой категории.

import type { GroupCategoriesList, ExpenseCategory } from "../types/group_category"

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

/** Список категорий, доступных группе. Возвращает { items, total, restricted } */
export async function listGroupCategories(
  groupId: number,
  params?: { q?: string; limit?: number; offset?: number }
): Promise<GroupCategoriesList> {
  const limit = params?.limit ?? 100
  const offset = params?.offset ?? 0
  const q = params?.q ? `&q=${encodeURIComponent(params.q)}` : ""
  const url = `${API_URL}/groups/${groupId}/categories?limit=${limit}&offset=${offset}${q}`
  const res = await fetch(url, { headers: { "x-telegram-initdata": getTelegramInitData() } })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

/** Линкует существующую глобальную категорию к группе (owner) */
export async function linkGroupCategory(groupId: number, categoryId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/categories/link`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ category_id: categoryId }),
  })
  if (!res.ok) throw new Error(await res.text())
}

/** Убирает категорию из белого списка (owner) */
export async function unlinkGroupCategory(groupId: number, categoryId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/categories/${categoryId}`
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "x-telegram-initdata": getTelegramInitData() },
  })
  if (!res.ok) throw new Error(await res.text())
}

/** Создаёт новую глобальную категорию и сразу линкует к группе (owner + PRO). Возвращает созданную категорию. */
export async function createAndLinkGroupCategory(
  groupId: number,
  payload: { name: string; icon?: string | null }
): Promise<ExpenseCategory> {
  const url = `${API_URL}/groups/${groupId}/categories`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-telegram-initdata": getTelegramInitData(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}
