// src/api/groupsApi.ts
// Пагинация + серверный поиск. total берём из X-Total-Count.

import type { Group, GroupPreview } from "../types/group"

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

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
    let msg = ""
    try { msg = await res.text() } catch {}
    throw new Error(msg || `HTTP ${res.status}`)
  }
  // @ts-ignore
  return res.status === 204 ? undefined : await res.json()
}

export async function getUserGroups(
  userId: number,
  params?: {
    limit?: number
    offset?: number
    includeHidden?: boolean
    includeArchived?: boolean
    q?: string
  }
): Promise<{ items: GroupPreview[]; total: number }> {
  const limit = params?.limit ?? 20
  const offset = params?.offset ?? 0
  const includeHidden = params?.includeHidden ? "true" : "false"
  const includeArchived = params?.includeArchived ? "true" : "false"
  const q = (params?.q ?? "").trim()

  const sp = new URLSearchParams()
  sp.set("limit", String(limit))
  sp.set("offset", String(offset))
  sp.set("include_hidden", includeHidden)
  sp.set("include_archived", includeArchived)
  if (q.length > 0) sp.set("q", q)

  const url = `${API_URL}/groups/user/${userId}?` + sp.toString()

  const res = await fetch(url, { headers: { "x-telegram-initdata": getTelegramInitData() } })
  if (!res.ok) {
    let msg = ""
    try { msg = await res.text() } catch {}
    throw new Error(msg || `HTTP ${res.status}`)
  }

  const items: GroupPreview[] = await res.json()
  const totalHeader = res.headers.get("X-Total-Count") || res.headers.get("x-total-count")
  const total = totalHeader ? (parseInt(totalHeader, 10) || items.length) : items.length
  return { items, total }
}

export async function getGroupDetails(groupId: number, offset: number = 0, limit?: number): Promise<Group> {
  const sp = new URLSearchParams()
  sp.set("offset", String(offset))
  if (typeof limit === "number") sp.set("limit", String(limit))
  const url = `${API_URL}/groups/${groupId}/detail/?` + sp.toString()
  return await fetchJson<Group>(url)
}

export async function getGroupBalances(groupId: number) {
  const url = `${API_URL}/groups/${groupId}/balances`
  return await fetchJson(url)
}

export async function getGroupSettleUp(groupId: number) {
  const url = `${API_URL}/groups/${groupId}/settle-up`
  return await fetchJson(url)
}

export async function createGroup(payload: { name: string; description: string; owner_id: number }): Promise<Group> {
  const url = `${API_URL}/groups/`
  return await fetchJson<Group>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function hideGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/hide`
  await fetchJson<void>(url, { method: "POST" })
}
export async function unhideGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/unhide`
  await fetchJson<void>(url, { method: "POST" })
}

export async function archiveGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/archive`
  await fetchJson<void>(url, { method: "POST" })
}
export async function unarchiveGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/unarchive`
  await fetchJson<void>(url, { method: "POST" })
}

export async function softDeleteGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}`
  await fetchJson<void>(url, { method: "DELETE" })
}
export async function restoreGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/restore`
  await fetchJson<void>(url, { method: "POST" })
}

export async function patchGroupCurrency(groupId: number, code: string): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/currency?code=${encodeURIComponent(code)}`
  await fetchJson<void>(url, { method: "PATCH" })
}

/** Обновление end_date / auto_archive */
export async function patchGroupSchedule(
  groupId: number,
  payload: { end_date?: string | null; auto_archive?: boolean }
): Promise<Group> {
  const url = `${API_URL}/groups/${groupId}/schedule`
  return await fetchJson<Group>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

/** ЧАСТИЧНОЕ обновление инфо группы (название/описание).
 *  description допускает null для очистки описания на бэке.
 */
export async function patchGroupInfo(
  groupId: number,
  payload: { name?: string; description?: string | null }
): Promise<Group> {
  const url = `${API_URL}/groups/${groupId}`
  return await fetchJson<Group>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}
