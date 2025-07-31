// src/api/groupsApi.ts

/**
 * API-функции для получения списка групп пользователя и деталей одной группы.
 * Абсолютные пути с использованием переменной API_URL (как во всех твоих api-файлах).
 * fetch, а не axios, для единообразия.
 */

import type { Group } from "../types/group"

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

/**
 * Получить список групп, где состоит пользователь.
 * GET /groups/user/{user_id}
 */
export async function getUserGroups(userId: number): Promise<Group[]> {
  const response = await fetch(`${API_URL}/groups/user/${userId}`)
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}

/**
 * Получить детали (полную информацию) о конкретной группе.
 * GET /groups/{group_id}/detail/
 */
export async function getGroupDetails(groupId: number): Promise<Group> {
  const response = await fetch(`${API_URL}/groups/${groupId}/detail/`)
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}
