// src/api/groupMembersApi.ts

import type { GroupMember } from "../types/group_member"
const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

export async function getGroupMembers(groupId: number, offset = 0, limit = 20): Promise<{ total: number, members: GroupMember[] }> {
  const response = await fetch(`${API_URL}/group_members/group/${groupId}?offset=${offset}&limit=${limit}`)
  if (!response.ok) throw new Error(await response.text())
  return await response.json()
}
