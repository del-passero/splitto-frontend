// src/api/groupMembersApi.ts
// API участников групп: get/add/remove/leave + x-telegram-initdata заголовок.

import type { GroupMember } from "../types/group_member"

const API_URL =
  import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

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
  // @ts-ignore – корректно вернуть void для 204
  return res.status === 204 ? undefined : await res.json()
}

/** Получить участников группы с пагинацией. Возвращает { total, items } */
export async function getGroupMembers(
  groupId: number,
  offset: number = 0,
  limit: number = 20
): Promise<{ total: number; items: GroupMember[] }> {
  const url = `${API_URL}/group-members/group/${groupId}?offset=${offset}&limit=${limit}`
  return await fetchJson<{ total: number; items: GroupMember[] }>(url)
}

/** Добавить участника в группу (может любой участник активной группы) */
export async function addGroupMember(payload: {
  group_id: number
  user_id: number
}): Promise<GroupMember> {
  const url = `${API_URL}/group-members/`
  return await fetchJson<GroupMember>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

/** Удалить участника из группы (только владелец) */
export async function removeGroupMember(memberId: number): Promise<void> {
  const url = `${API_URL}/group-members/${memberId}`
  await fetchJson<void>(url, { method: "DELETE" })
}

/** Выйти из группы (self-leave). Владелец не может; 409 — если есть не удалённые транзакции. */
export async function leaveGroup(groupId: number): Promise<void> {
  const url = `${API_URL}/group-members/group/${groupId}/leave`
  await fetchJson<void>(url, { method: "POST" })
}
