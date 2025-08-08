// src/api/groupsApi.ts
// API-групп: добавили пагинацию, флаги includeHidden/includeArchived,
// работу с X-Total-Count и новые действия (hide/unhide, archive/unarchive, softDelete/restore, patchCurrency).

import type { Group, GroupPreview } from "../types/group"

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

// Telegram WebApp initData (нужен бэку для авторизации запроса)
function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    "x-telegram-initdata": getTelegramInitData(),
  }
  const res = await fetch(input, { ...init, headers })
  if (!res.ok) {
    let errText: string
    try { errText = await res.text() } catch { errText = res.statusText }
    throw new Error(errText || `HTTP ${res.status}`)
  }
  return await res.json()
}

/** Получить список всех групп (админ/служебный) — теперь с пагинацией */
export async function getGroups(params?: { limit?: number; offset?: number }): Promise<Group[]> {
  const limit = params?.limit ?? 100
  const offset = params?.offset ?? 0
  const url = `${API_URL}/groups?limit=${limit}&offset=${offset}`
  return await fetchJson<Group[]>(url)
}

/**
 * Получить список групп текущего пользователя (кастомное превью).
 * Бэкенд кладёт total в заголовок X-Total-Count, тело — массив GroupPreview (прошлый формат).
 * Мы возвращаем { items, total }.
 */
export async function getUserGroups(
  userId: number,
  params?: {
    limit?: number
    offset?: number
    includeHidden?: boolean
    includeArchived?: boolean
  }
): Promise<{ items: GroupPreview[]; total: number }> {
  const limit = params?.limit ?? 20
  const offset = params?.offset ?? 0
  const includeHidden = params?.includeHidden ? "true" : "false"
  const includeArchived = params?.includeArchived ? "true" : "false"
  const url = `${API_URL}/groups/user/${userId}?limit=${limit}&offset=${offset}&include_hidden=${includeHidden}&include_archived=${includeArchived}`

  const headers: HeadersInit = { "x-telegram-initdata": getTelegramInitData() }
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(await res.text())
  const items: GroupPreview[] = await res.json()
  const totalHeader = res.headers.get("X-Total-Count") || res.headers.get("x-total-count")
  const total = totalHeader ? parseInt(totalHeader, 10) || items.length : items.length
  return { items, total }
}

/** Детали группы (bulk список участников с опциональной пагинацией) */
export async function getGroupDetails(groupId: number, offset: number = 0, limit?: number): Promise<Group> {
  let url = `${API_URL}/groups/${groupId}/detail/?offset=${offset}`
  if (typeof limit === "number") url += `&limit=${limit}`
  return await fetchJson<Group>(url)
}

/** Балансы по группе */
export async function getGroupBalances(groupId: number): Promise<Array<{ user_id: number; balance: number }>> {
  const url = `${API_URL}/groups/${groupId}/balances`
  return await fetchJson(url)
}

/** Расчёт settle-up по группе */
export async function getGroupSettleUp(groupId: number): Promise<Array<{ from_user_id: number; to_user_id: number; amount: number }>> {
  const url = `${API_URL}/groups/${groupId}/settle-up`
  return await fetchJson(url)
}

/** Создать группу */
export async function createGroup(payload: { name: string; description: string; owner_id: number }): Promise<Group> {
  const url = `${API_URL}/groups/`
  return await fetchJson<Group>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

/** Персонально скрыть группу */
export async function hideGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/hide`
  await fetchJson<void>(url, { method: "POST" })
}

/** Снять персональное скрытие */
export async function unhideGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/unhide`
  await fetchJson<void>(url, { method: "POST" })
}

/** Архивировать группу (только владелец, 409 если есть долги) */
export async function archiveGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/archive`
  await fetchJson<void>(url, { method: "POST" })
}

/** Разархивировать группу (только владелец) */
export async function unarchiveGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/unarchive`
  await fetchJson<void>(url, { method: "POST" })
}

/** Soft-delete (только владелец, 409 если есть долги) */
export async function softDeleteGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}`
  await fetchJson<void>(url, { method: "DELETE" })
}

/** Восстановить soft-deleted (возвращается в archived) */
export async function restoreGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/restore`
  await fetchJson<void>(url, { method: "POST" })
}

/** Сменить валюту группы (только владелец, запрет если уже есть транзакции) */
export async function patchGroupCurrency(groupId: number, code: string): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/currency?code=${encodeURIComponent(code)}`
  await fetchJson<void>(url, { method: "PATCH" })
}
