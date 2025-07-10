// src/types/user.ts
export interface User {
  id: number
  telegram_id: number
  username?: string
  first_name?: string
  last_name?: string
  name?: string
  photo_url?: string
  language_code?: string
  allows_write_to_pm?: boolean
  created_at: string
  updated_at: string
  is_pro: boolean
  invited_friends_count: number
}
