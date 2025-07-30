// src/types/group.ts

export interface Group {
  id: number
  name: string
  description?: string
  owner_id: number
  created_at?: string
}

export interface GroupUser {
  id: number
  name: string
  telegram_id?: number
  photo_url?: string
}

export interface GroupCreate {
  name: string
  description?: string
  owner_id: number
  user_ids: number[]
}

export interface GroupWithMembers extends Group {
  members: GroupUser[]
}
