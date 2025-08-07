// src/api/groupsApi.ts

/**
 * API-функции для получения списка групп пользователя, деталей одной группы и балансов.
 * Единый стиль с fetch, строгая типизация, обработка ошибок.
 */

import type { Group, GroupPreview } from "../types/group"
import type { GroupMember } from "../types/group_member"

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

/**
 * Получить список групп пользователя (с превью участников и счётчиком).
 * GET /groups/user/{user_id}
 */
export async function getUserGroups(userId: number): Promise<GroupPreview[]> {
  const response = await fetch(`${API_URL}/groups/user/${userId}`)
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}

/**
 * Получить детали группы (всех участников, всю структуру).
 * GET /groups/{group_id}/detail/
 */
export async function getGroupDetails(groupId: number, offset: number = 0, limit?: number): Promise<Group> {
  let url = `${API_URL}/groups/${groupId}/detail/?offset=${offset}`
  if (typeof limit === "number") url += `&limit=${limit}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}

/**
 * Получить участников группы с пагинацией.
 * GET /group_members/group/{group_id}?offset=0&limit=20
 * Возвращает { total, items: [...] }
 */
export async function getGroupMembersPaginated(
  groupId: number,
  offset: number = 0,
  limit: number = 20
): Promise<{ total: number, items: GroupMember[] }> {
  const url = `${API_URL}/group-members/group/${groupId}?offset=${offset}&limit=${limit}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}

/**
 * Получить балансы участников группы
 * GET /groups/{group_id}/balances
 */
export async function getGroupBalances(groupId: number): Promise<{ user_id: number, balance: number }[]> {
  const response = await fetch(`${API_URL}/groups/${groupId}/balances`)
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}

/**
 * Получить settle-up для группы
 * GET /groups/{group_id}/settle-up
 */
export async function getGroupSettleUp(groupId: number): Promise<any[]> {
  const response = await fetch(`${API_URL}/groups/${groupId}/settle-up`)
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}

/**
 * Создать новую группу (POST /groups/)
 * @param name - Название группы
 * @param description - Описание группы
 * @param owner_id - ID создателя (текущий пользователь)
 */
export async function createGroup({
  name,
  description,
  owner_id,
}: {
  name: string
  description?: string
  owner_id: number
}): Promise<Group> {
  const response = await fetch(`${API_URL}/groups/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      owner_id,
    }),
  })
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}
