// src/api/groupsApi.ts

import axios from "axios"
import type { Group, GroupWithMembers, GroupCreate } from "../types/group"

// Настройка baseURL
const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
const BASE_URL = `${API_URL}/groups`
const MEMBERS_URL = `${API_URL}/group_members`

/**
 * Получить список групп пользователя
 */
export const getGroupsByUser = async (userId: number): Promise<Group[]> => {
  const { data } = await axios.get(`${BASE_URL}/user/${userId}`)
  return data
}

/**
 * Получить детальную информацию о группе (без участников)
 */
export const getGroupById = async (groupId: number): Promise<Group> => {
  const { data } = await axios.get(`${BASE_URL}/${groupId}/detail/`)
  return data
}

/**
 * Получить детальную информацию о группе с участниками
 */
export const getGroupWithMembers = async (groupId: number): Promise<GroupWithMembers> => {
  const groupRes = await axios.get(`${BASE_URL}/${groupId}/detail/`)
  const group: Group = groupRes.data
  const membersRes = await axios.get(`${MEMBERS_URL}/group/${groupId}`)
  const members = membersRes.data.map((item: any) => item.user)
  return { ...group, members }
}

/**
 * Создать новую группу
 */
export const createGroup = async (data: GroupCreate): Promise<Group> => {
  const { user_ids, ...groupData } = data
  const groupRes = await axios.post(`${BASE_URL}/`, groupData)
  const group: Group = groupRes.data
  if (user_ids && user_ids.length > 0) {
    await Promise.all(
      user_ids.map(userId =>
        axios.post(`${MEMBERS_URL}/`, { group_id: group.id, user_id: userId })
      )
    )
  }
  return group
}

/**
 * Обновить группу (название, описание)
 */
export const updateGroup = async (groupId: number, data: Partial<GroupCreate>): Promise<Group> => {
  const { data: updated } = await axios.put(`${BASE_URL}/${groupId}/`, data)
  return updated
}

/**
 * Удалить группу
 */
export const deleteGroup = async (groupId: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/${groupId}/`)
}

/**
 * Получить инвайт-ссылку (token) для группы
 */
export const getGroupInvite = async (groupId: number): Promise<{ id: number, group_id: number, token: string }> => {
  const { data } = await axios.post(`${BASE_URL}/${groupId}/invite`)
  return data
}

/**
 * Принять инвайт для группы по токену (добавляет текущего пользователя)
 */
export const acceptGroupInvite = async (token: string): Promise<any> => {
  const { data } = await axios.post(`${BASE_URL}/accept-invite`, { token })
  return data
}
