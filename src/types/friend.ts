// frontend/src/types/friend.ts

// Минимальный тип пользователя (для отображения в UserCard)
export interface UserShort {
  id: number
  telegram_id: number
  name?: string
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
  // Можно добавить другие поля, если понадобится
}

// Тип для одного друга (FriendOut)
export interface Friend {
  id: number
  user_id: number         // ID владельца связи (в моём списке — это я; в списке "контакты контакта" — это он)
  friend_id: number       // ID друга
  created_at: string
  updated_at: string
  hidden: boolean
  // Вложенный объект user
  user: UserShort
  // Вложенный объект friend
  friend: UserShort
}

// Тип для инвайта друга
export interface FriendInvite {
  id: number
  from_user_id: number
  token: string
}

// Тип ответа для списка друзей с пагинацией (моих или "контактов контакта")
export interface FriendsResponse {
  total: number
  friends: Friend[]
}

// На всякий: alias для названий общих групп
export type CommonGroupName = string
