// src/api/groupsApi.ts
// Пагинация + серверный поиск. total берём из X-Total-Count.

import type { Group, GroupPreview } from "../types/group"

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
// База для статических файлов = API без "/api"
const FILES_BASE_URL: string = (import.meta.env.VITE_FILES_BASE_URL as string) || API_URL.replace(/\/api\/?$/i, "")

function toAbsoluteUrl(input: string): string {
  const url = String(input || "").trim()
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  const base = FILES_BASE_URL.replace(/\/$/, "")
  const path = url.startsWith("/") ? url : `/${url}`
  return `${base}${path}`
}

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

/** Список групп пользователя c фильтрами/сортировкой */
export async function getUserGroups(
  userId: number,
  params?: {
    limit?: number
    offset?: number
    includeHidden?: boolean
    includeArchived?: boolean
    includeDeleted?: boolean
    q?: string
    sortBy?: "last_activity" | "name" | "created_at" | "members_count"
    sortDir?: "asc" | "desc"
  }
): Promise<{ items: GroupPreview[]; total: number }> {
  const limit = params?.limit ?? 20
  const offset = params?.offset ?? 0
  const includeHidden = params?.includeHidden ? "true" : "false"
  const includeArchived = params?.includeArchived ? "true" : "false"
  const includeDeleted = params?.includeDeleted ? "true" : "false"
  const q = (params?.q ?? "").trim()

  const sp = new URLSearchParams()
  sp.set("limit", String(limit))
  sp.set("offset", String(offset))
  sp.set("include_hidden", includeHidden)
  sp.set("include_archived", includeArchived)
  sp.set("include_deleted", includeDeleted)
  if (q.length > 0) sp.set("q", q)
  if (params?.sortBy) sp.set("sort_by", params.sortBy)
  if (params?.sortDir) sp.set("sort_dir", params.sortDir)

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
  const g = await fetchJson<Group>(url)
  // Нормализуем avatar_url в абсолютный, если вдруг сервер вернул относительный
  const any: any = g as any
  if (any?.avatar_url && typeof any.avatar_url === "string") {
    any.avatar_url = toAbsoluteUrl(any.avatar_url)
  }
  return g
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
export async function unarchiveGroup(groupId: number, returnFull: boolean = false): Promise<Group | void> {
  const url = `${API_URL}/groups/${groupId}/unarchive?return_full=${returnFull ? "true" : "false"}`
  return await fetchJson<Group | void>(url, { method: "POST" })
}

export async function softDeleteGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}`
  await fetchJson<void>(url, { method: "DELETE" })
}
export async function restoreGroup(groupId: number, opts?: { toActive?: boolean; returnFull?: boolean }): Promise<Group | void> {
  const sp = new URLSearchParams()
  if (opts?.toActive) sp.set("to_active", "true")
  if (opts?.returnFull) sp.set("return_full", "true")
  const url = `${API_URL}/groups/${groupId}/restore` + (sp.toString() ? `?${sp.toString()}` : "")
  return await fetchJson<Group | void>(url, { method: "POST" })
}
export async function hardDeleteGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/hard`
  await fetchJson<void>(url, { method: "DELETE" })
}

export async function patchGroupCurrency(groupId: number, code: string): Promise<void> {
  const url = `${API_URL}/groups/${groupId}/currency?code=${encodeURIComponent(code)}`
  await fetchJson<void>(url, { method: "PATCH" })
}

/** end_date / auto_archive */
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

/** Частичное обновление инфо группы */
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

/** Батч-превью долгов */
export async function getDebtsPreview(userId: number, groupIds: number[]): Promise<Record<string, { owe?: Record<string, number>; owed?: Record<string, number> }>> {
  if (!groupIds.length) return {}
  const sp = new URLSearchParams()
  sp.set("group_ids", groupIds.join(","))
  const url = `${API_URL}/groups/user/${userId}/debts-preview?${sp.toString()}`
  return await fetchJson(url)
}

/** Предпросмотр удаления — чтобы показать правильную модалку */
export async function getDeletePreview(groupId: number): Promise<{
  mode: "forbidden" | "soft" | "hard" | "disabled"
  has_debts: boolean
  has_transactions: boolean
}> {
  const url = `${API_URL}/groups/${groupId}/delete-preview`
  return await fetchJson(url)
}

/** Установка аватара группы по публичному URL — ТЕПЕРЬ всегда абсолютный */
export async function setGroupAvatarByUrl(groupId: number, url: string): Promise<Group> {
  const endpoint = `${API_URL}/groups/${groupId}/avatar/url`
  const absolute = toAbsoluteUrl(url)
  return await fetchJson<Group>(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: absolute }),
  })
}
