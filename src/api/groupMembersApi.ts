// src/api/groupMembersApi.ts

import type { GroupMember } from "../types/group_member"
const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

/**
 * Получить участников группы с пагинацией.
 * Возвращает { total, items: GroupMember[] }
 */
export async function getGroupMembers(
  groupId: number,
  offset: number = 0,
  limit: number = 20
): Promise<{ total: number, items: GroupMember[] }> {
  const url = `${API_URL}/group-members/group/${groupId}?offset=${offset}&limit=${limit}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}
