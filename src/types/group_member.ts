// src/types/group_member.ts

import type { User } from "./user"

export interface GroupMember {
  id: number
  group_id: number
  user: User
}
